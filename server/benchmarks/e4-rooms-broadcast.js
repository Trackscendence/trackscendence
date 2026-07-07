#!/usr/bin/env node
// E4 - rooms_update broadcast fan-out (audit finding B5).
//
// broadcastRooms (socket/socket.handlers.js) is `io.emit('rooms_update', await
// roomService.listRooms())`: it re-runs findVisibleRooms (the full roomInclude -
// owner + every seated player + their user rows) and pushes the whole snapshot
// to EVERY connected socket, on ~8 mutation paths, even for idempotent no-op
// re-seats. Bytes on the wire scale as rooms x players x sockets.
//
// B5's fix is threefold: scope the emit to a `rooms` watcher room (io.to), guard
// it on an actual change (no-op seats emit nothing), and eventually send
// per-room deltas instead of the whole snapshot. This experiment measures the
// three costs that fix removes, against real seeded rooms:
//   1. per-broadcast server work: listRooms() query + DTO map latency
//   2. per-recipient payload: serialized bytes of one rooms_update
//   3. fan-out: payload x recipients, io.emit(all sockets) vs io.to(watchers)
//
// Baseline experiment: the endpoint is unchanged, so this quantifies what B5 has
// on the table, not an after. Seeds its own rooms and removes them on exit.
//
// Usage:
//   node server/benchmarks/e4-rooms-broadcast.js \
//     [--rooms=100] [--players=4] [--sockets=500] [--watchers=20] [--runs=8]

const { performance } = require('node:perf_hooks')
const prisma = require('#db/prisma')
const roomService = require('#modules/room/room.service')

const parseArg = (name, fallback) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return match ? Number(match.split('=')[1]) : fallback
}

const ROOMS = parseArg('rooms', 100)
const PLAYERS = parseArg('players', 4)
const SOCKETS = parseArg('sockets', 500)
const WATCHERS = parseArg('watchers', 20)
const RUNS = parseArg('runs', 8)

const ROOM_PREFIX = 'bench-e4-room-'
const USER_PREFIX = 'bench_e4_user_'

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10

// Seed PLAYERS users and ROOMS open rooms, each seating all PLAYERS users. The
// same users sit in many rooms, which is fine here: listRooms() cost and payload
// depend on room and seat counts, not on user uniqueness, and it keeps the seed
// cheap. Everything is prefixed so cleanup is a prefix delete.
const seed = async () => {
  const users = []
  for (let index = 0; index < PLAYERS; index += 1) {
    users.push(
      await prisma.user.upsert({
        where: { username: `${USER_PREFIX}${index}` },
        update: {},
        create: {
          email: `${USER_PREFIX}${index}@bench.local`,
          username: `${USER_PREFIX}${index}`,
          displayName: `Bench E4 User ${index}`,
          passwordHash: 'x',
        },
        select: { id: true },
      }),
    )
  }
  const ownerId = users[0].id

  for (let index = 0; index < ROOMS; index += 1) {
    await prisma.room.create({
      data: {
        name: `${ROOM_PREFIX}${index}`,
        capacity: PLAYERS,
        status: 'OPEN',
        ownerId,
        players: {
          create: users.map((user) => ({ userId: user.id })),
        },
      },
    })
  }
}

const cleanup = async () => {
  // Deleting the rooms cascades their RoomPlayers; then remove the seed users.
  await prisma.room.deleteMany({ where: { name: { startsWith: ROOM_PREFIX } } })
  await prisma.user.deleteMany({
    where: { username: { startsWith: USER_PREFIX } },
  })
}

// Median listRooms() latency: the query + DTO map that runs on every broadcast.
const measureListRoomsMs = async () => {
  await roomService.listRooms() // warm up
  const times = []
  for (let run = 0; run < RUNS; run += 1) {
    const start = performance.now()
    await roomService.listRooms()
    times.push(performance.now() - start)
  }
  times.sort((first, second) => first - second)
  return Math.round(times[Math.floor(times.length / 2)] * 100) / 100
}

const run = async () => {
  console.log(
    `E4 rooms broadcast - seeding ${ROOMS} rooms x ${PLAYERS} players ` +
      `(sockets=${SOCKETS}, watchers=${WATCHERS}, runs=${RUNS})`,
  )
  await cleanup() // clear any leftovers from an aborted prior run
  await seed()

  const snapshot = await roomService.listRooms()
  const visibleRooms = snapshot.length
  const payloadBytes = Buffer.byteLength(JSON.stringify(snapshot))
  const listMs = await measureListRoomsMs()

  // Fan-out: broadcastRooms sends the full snapshot to every socket (io.emit).
  // B5 scopes it to the lobby/waiting watchers (io.to('rooms')).
  const currentBroadcastBytes = payloadBytes * SOCKETS
  const scopedBroadcastBytes = payloadBytes * WATCHERS
  const reductionFactor = Math.round((SOCKETS / WATCHERS) * 10) / 10

  console.log('')
  console.log(`Visible rooms in snapshot:     ${visibleRooms}`)
  console.log(`listRooms() latency (median):  ${listMs} ms`)
  console.log(`Payload per recipient:         ${kb(payloadBytes)} KB`)
  console.log('')
  console.log('Fan-out per single broadcast (payload x recipients):')
  console.log(
    `  current  io.emit -> ${SOCKETS} sockets:   ${kb(currentBroadcastBytes)} KB`,
  )
  console.log(
    `  scoped   io.to('rooms') -> ${WATCHERS} watchers: ${kb(scopedBroadcastBytes)} KB`,
  )
  console.log(`  reduction: ${reductionFactor}x fewer bytes on the wire`)
  console.log('')
  console.log(
    'A no-op re-seat currently emits the same ' +
      `${kb(currentBroadcastBytes)} KB for zero state change; B5's change-guard ` +
      'emits 0.',
  )

  return {
    rooms: ROOMS,
    playersPerRoom: PLAYERS,
    visibleRooms,
    sockets: SOCKETS,
    watchers: WATCHERS,
    listRoomsMs: listMs,
    payloadBytes,
    payloadKb: kb(payloadBytes),
    currentBroadcastKb: kb(currentBroadcastBytes),
    scopedBroadcastKb: kb(scopedBroadcastBytes),
    reductionFactor,
  }
}

run()
  .catch((error) => {
    console.error('E4 failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await cleanup()
    await prisma.$disconnect()
  })
