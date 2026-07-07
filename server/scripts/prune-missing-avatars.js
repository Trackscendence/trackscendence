#!/usr/bin/env node
// One-off maintenance: clear avatarUrl for users whose avatar file is gone.
//
// Before uploads were backed by a persistent volume, every redeploy wiped
// /app/uploads while the database kept the avatarUrl reference, leaving those
// users with a broken image. This nulls the dangling references so the client
// falls back to the initials avatar (the Avatar component renders a placeholder
// when src is empty).
//
// Safe to run repeatedly. Pass --dry-run to report without writing.
//
//   node server/scripts/prune-missing-avatars.js [--dry-run]

const fs = require('fs/promises')
const prisma = require('#db/prisma')
const { getAvatarStoragePathFromUrl } = require('#modules/users/users.avatar')

const fileExists = async (storagePath) => {
  try {
    await fs.access(storagePath)
    return true
  } catch {
    return false
  }
}

const run = async () => {
  const isDryRun = process.argv.includes('--dry-run')

  const usersWithAvatar = await prisma.user.findMany({
    where: { avatarUrl: { not: null } },
    select: { id: true, username: true, avatarUrl: true },
  })

  const missing = []

  for (const user of usersWithAvatar) {
    const storagePath = getAvatarStoragePathFromUrl({
      avatarUrl: user.avatarUrl,
    })

    // A null path means the value is malformed and can't map to a real file;
    // treat it as missing so it gets cleared too.
    if (!storagePath || !(await fileExists(storagePath))) {
      missing.push(user)
    }
  }

  console.log(
    `Checked ${usersWithAvatar.length} user(s) with an avatarUrl; ` +
      `${missing.length} reference a file that is gone.`,
  )

  for (const user of missing) {
    console.log(`  - ${user.username} (id ${user.id}): ${user.avatarUrl}`)
  }

  if (missing.length === 0) {
    return
  }

  if (isDryRun) {
    console.log('Dry run: no changes written.')
    return
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: missing.map((user) => user.id) } },
    data: { avatarUrl: null },
  })

  console.log(`Cleared avatarUrl for ${result.count} user(s).`)
}

run()
  .catch((error) => {
    console.error('prune-missing-avatars failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
