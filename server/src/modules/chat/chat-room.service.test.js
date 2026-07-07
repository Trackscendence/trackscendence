const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const chatRoomService = require('./chat-room.service')

const now = new Date('2026-07-07T00:00:00.000Z')
const admin = { id: 1, username: 'admin' }
const member = { id: 2, username: 'member' }
const stranger = { id: 3, username: 'stranger' }

const user = (data) => ({
  displayName: null,
  avatarUrl: null,
  ...data,
})

const membership = ({
  isMuted = false,
  role = 'MEMBER',
  status = 'ACTIVE',
  user: membershipUser = member,
}) => ({
  id: Number(`${membershipUser.id}1`),
  roomId: 10,
  userId: membershipUser.id,
  role,
  status,
  isMuted,
  joinedAt: status === 'ACTIVE' ? now : null,
  createdAt: now,
  updatedAt: now,
  invitedBy: null,
  user: user(membershipUser),
})

const room = ({ memberships = [], visibility = 'PUBLIC' } = {}) => ({
  id: 10,
  name: 'Strategy',
  visibility,
  createdBy: user(admin),
  memberships,
  createdAt: now,
  updatedAt: now,
})

describe('chatRoomService.joinRoom', () => {
  it('blocks invite-only rooms without an invitation', async () => {
    const repository = {
      findRoomById: async () => room({ visibility: 'INVITE_ONLY' }),
    }

    await assert.rejects(
      () => chatRoomService.joinRoom(stranger, { roomId: 10 }, { repository }),
      /invite-only/,
    )
  })

  it('activates an invited member', async () => {
    let upsertData
    const invitedRoom = room({
      visibility: 'INVITE_ONLY',
      memberships: [
        membership({ role: 'ADMIN', user: admin }),
        membership({ status: 'INVITED', user: stranger }),
      ],
    })
    const activeRoom = room({
      visibility: 'INVITE_ONLY',
      memberships: [
        membership({ role: 'ADMIN', user: admin }),
        membership({ user: stranger }),
      ],
    })
    const repository = {
      findRoomById: async () => activeRoom,
      upsertMembership: async (data) => {
        upsertData = data
        return membership({ user: stranger })
      },
    }
    let firstRead = true
    repository.findRoomById = async () => {
      if (firstRead) {
        firstRead = false
        return invitedRoom
      }
      return activeRoom
    }

    const result = await chatRoomService.joinRoom(
      stranger,
      { roomId: 10 },
      { repository },
    )

    assert.equal(upsertData.status, 'ACTIVE')
    assert.equal(result.room.isJoined, true)
  })
})

describe('chatRoomService.inviteUser', () => {
  it('requires the caller to be an admin', async () => {
    const repository = {
      findRoomById: async () => room({ memberships: [membership({})] }),
    }

    await assert.rejects(
      () =>
        chatRoomService.inviteUser(
          member,
          { roomId: 10 },
          { targetUserId: 3 },
          { repository },
        ),
      /Only room admins/,
    )
  })

  it('creates an invited membership for admins', async () => {
    let inviteData
    const adminRoom = room({
      memberships: [membership({ role: 'ADMIN', user: admin })],
    })
    const invitedRoom = room({
      memberships: [
        membership({ role: 'ADMIN', user: admin }),
        membership({ status: 'INVITED', user: stranger }),
      ],
    })
    const repository = {
      findPublicUserById: async () => user(stranger),
      findRoomById: async () => adminRoom,
      upsertMembership: async (data) => {
        inviteData = data
        return membership({ status: 'INVITED', user: stranger })
      },
    }
    let firstRead = true
    repository.findRoomById = async () => {
      if (firstRead) {
        firstRead = false
        return adminRoom
      }
      return invitedRoom
    }

    const result = await chatRoomService.inviteUser(
      admin,
      { roomId: 10 },
      { targetUserId: 3 },
      { repository },
    )

    assert.equal(inviteData.status, 'INVITED')
    assert.equal(result.room.members[1].status, 'INVITED')
  })
})

describe('chatRoomService.createMessage', () => {
  it('rejects muted members', async () => {
    const repository = {
      findRoomById: async () =>
        room({ memberships: [membership({ isMuted: true })] }),
    }

    await assert.rejects(
      () =>
        chatRoomService.createMessage(
          member,
          { message: 'hello', recipient: 'chat:10' },
          { repository },
        ),
      /muted/,
    )
  })

  it('persists messages for active members', async () => {
    const repository = {
      createMessage: async ({ message, roomId, userId }) => ({
        id: 77,
        roomId,
        userId,
        message,
        createdAt: now,
        user: user(member),
      }),
      findRoomById: async () => room({ memberships: [membership({})] }),
    }

    const result = await chatRoomService.createMessage(
      member,
      { message: 'hello room', recipient: 'chat:10' },
      { repository },
    )

    assert.equal(result.id, 77)
    assert.equal(result.recipient, 'chat:10')
    assert.equal(result.message, 'hello room')
  })
})
