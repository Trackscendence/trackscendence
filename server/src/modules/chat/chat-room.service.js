const BadRequestException = require('#exceptions/bad-request.exception')
const ConflictException = require('#exceptions/conflict.exception')
const ForbiddenException = require('#exceptions/forbidden.exception')
const NotFoundException = require('#exceptions/not-found.exception')
const chatRoomRepository = require('#modules/chat/chat-room.repository')

const CHAT_ROOM_PREFIX = 'chat:'
const CHAT_ROOM_NAME_MAX_LENGTH = 48
const CHAT_MESSAGE_MAX_LENGTH = 500
const MESSAGE_HISTORY_LIMIT = 100
const PRISMA_INT_MAX = 2147483647

const CHAT_ROOM_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  INVITE_ONLY: 'INVITE_ONLY',
}

const CHAT_MEMBER_ROLE = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
}

const CHAT_MEMBER_STATUS = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  KICKED: 'KICKED',
  LEFT: 'LEFT',
}

const normalizeVisibility = (visibility) => {
  const value =
    typeof visibility === 'string' ? visibility.trim().toUpperCase() : ''

  if (value === CHAT_ROOM_VISIBILITY.PUBLIC) return value
  if (value === CHAT_ROOM_VISIBILITY.INVITE_ONLY) return value

  throw new BadRequestException('Invalid request data', {
    details: ['visibility must be PUBLIC or INVITE_ONLY'],
  })
}

const parsePositiveInteger = (value, fieldName) => {
  const number = Number(value)

  if (!Number.isInteger(number) || number < 1) {
    throw new BadRequestException('Invalid request data', {
      details: [`${fieldName} must be a positive integer`],
    })
  }

  if (number > PRISMA_INT_MAX) {
    throw new BadRequestException('Invalid request data', {
      details: [`${fieldName} must not be greater than ${PRISMA_INT_MAX}`],
    })
  }

  return number
}

const getTrimmedString = (value) => {
  return typeof value === 'string' ? value.trim() : ''
}

const validateRoomName = (name) => {
  const normalizedName = getTrimmedString(name)

  if (!normalizedName) {
    throw new BadRequestException('Invalid request data', {
      details: ['name is required'],
    })
  }

  if (normalizedName.length > CHAT_ROOM_NAME_MAX_LENGTH) {
    throw new BadRequestException('Invalid request data', {
      details: [`name must be at most ${CHAT_ROOM_NAME_MAX_LENGTH} characters`],
    })
  }

  return normalizedName
}

const validateCreateRoomInput = (payload = {}) => ({
  name: validateRoomName(payload.name),
  visibility: normalizeVisibility(payload.visibility || 'PUBLIC'),
})

const validateMessage = (message) => {
  const normalizedMessage = getTrimmedString(message)

  if (!normalizedMessage) {
    throw new BadRequestException('Invalid request data', {
      details: ['message is required'],
    })
  }

  if (normalizedMessage.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new BadRequestException('Invalid request data', {
      details: [
        `message must be at most ${CHAT_MESSAGE_MAX_LENGTH} characters`,
      ],
    })
  }

  return normalizedMessage
}

const getRoomIdFromParams = (params = {}) => {
  return parsePositiveInteger(params.roomId, 'roomId')
}

const getTargetUserIdFromParams = (params = {}) => {
  return parsePositiveInteger(params.targetUserId, 'targetUserId')
}

const getTargetUserIdFromPayload = (payload = {}) => {
  return parsePositiveInteger(payload.targetUserId, 'targetUserId')
}

const getMembershipForUser = (room, userId) => {
  return room.memberships.find((membership) => membership.userId === userId)
}

const isActiveMember = (membership) => {
  return membership?.status === CHAT_MEMBER_STATUS.ACTIVE
}

const toChatUser = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
})

const toMembershipDto = (membership) => ({
  user: toChatUser(membership.user),
  role: membership.role,
  status: membership.status,
  isMuted: membership.isMuted,
  joinedAt: membership.joinedAt,
  invitedBy: membership.invitedBy ? toChatUser(membership.invitedBy) : null,
})

const toRoomDto = (room, viewerId) => {
  const membership = getMembershipForUser(room, viewerId)
  const activeMembership = isActiveMember(membership) ? membership : null

  return {
    id: room.id,
    socketRoom: `${CHAT_ROOM_PREFIX}${room.id}`,
    name: room.name,
    visibility: room.visibility,
    createdBy: toChatUser(room.createdBy),
    membership: membership ? toMembershipDto(membership) : null,
    isJoined: Boolean(activeMembership),
    isInvited: membership?.status === CHAT_MEMBER_STATUS.INVITED,
    isAdmin: activeMembership?.role === CHAT_MEMBER_ROLE.ADMIN,
    members: activeMembership
      ? room.memberships
          .filter((item) =>
            [CHAT_MEMBER_STATUS.ACTIVE, CHAT_MEMBER_STATUS.INVITED].includes(
              item.status,
            ),
          )
          .map(toMembershipDto)
      : [],
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  }
}

const toMessageDto = (message) => ({
  id: message.id,
  roomId: message.roomId,
  recipient: `${CHAT_ROOM_PREFIX}${message.roomId}`,
  message: message.message,
  createdAt: message.createdAt,
  user: toChatUser(message.user),
})

const getRoomOrThrow = async (roomId, repository) => {
  const room = await repository.findRoomById(roomId)
  if (!room) throw new NotFoundException('Chat room not found')
  return room
}

const assertActiveMember = (room, userId) => {
  const membership = getMembershipForUser(room, userId)
  if (!isActiveMember(membership)) {
    throw new ForbiddenException('Join the chat room before using it')
  }
  return membership
}

const assertAdmin = (room, userId) => {
  const membership = assertActiveMember(room, userId)
  if (membership.role !== CHAT_MEMBER_ROLE.ADMIN) {
    throw new ForbiddenException('Only room admins can perform this action')
  }
  return membership
}

const listRooms = async (user, { repository = chatRoomRepository } = {}) => {
  const rooms = await repository.listVisibleRoomsForUser(user.id)
  return { rooms: rooms.map((room) => toRoomDto(room, user.id)) }
}

const createRoom = async (
  user,
  payload,
  { repository = chatRoomRepository } = {},
) => {
  const input = validateCreateRoomInput(payload)
  const room = await repository.createRoom({
    createdById: user.id,
    ...input,
  })

  return { room: toRoomDto(room, user.id) }
}

const joinRoom = async (
  user,
  params,
  { repository = chatRoomRepository } = {},
) => {
  const roomId = getRoomIdFromParams(params)
  const room = await getRoomOrThrow(roomId, repository)
  const membership = getMembershipForUser(room, user.id)

  if (isActiveMember(membership)) {
    return { room: toRoomDto(room, user.id) }
  }

  if (membership?.status === CHAT_MEMBER_STATUS.KICKED) {
    throw new ForbiddenException('You were removed from this chat room')
  }

  if (
    room.visibility === CHAT_ROOM_VISIBILITY.INVITE_ONLY &&
    membership?.status !== CHAT_MEMBER_STATUS.INVITED
  ) {
    throw new ForbiddenException('This chat room is invite-only')
  }

  await repository.upsertMembership({
    isMuted: false,
    joinedAt: new Date(),
    role: membership?.role || CHAT_MEMBER_ROLE.MEMBER,
    roomId,
    status: CHAT_MEMBER_STATUS.ACTIVE,
    userId: user.id,
  })

  return {
    room: toRoomDto(await repository.findRoomById(roomId), user.id),
  }
}

const inviteUser = async (
  user,
  params,
  payload,
  { repository = chatRoomRepository } = {},
) => {
  const roomId = getRoomIdFromParams(params)
  const targetUserId = getTargetUserIdFromPayload(payload)

  if (targetUserId === user.id) {
    throw new BadRequestException('You cannot invite yourself')
  }

  const room = await getRoomOrThrow(roomId, repository)
  assertAdmin(room, user.id)

  const targetUser = await repository.findPublicUserById(targetUserId)
  if (!targetUser) throw new NotFoundException('Target user not found')

  const existingMembership = getMembershipForUser(room, targetUserId)
  if (existingMembership?.status === CHAT_MEMBER_STATUS.ACTIVE) {
    throw new ConflictException('That user is already in this chat room')
  }

  await repository.upsertMembership({
    invitedById: user.id,
    isMuted: false,
    joinedAt: null,
    role: CHAT_MEMBER_ROLE.MEMBER,
    roomId,
    status: CHAT_MEMBER_STATUS.INVITED,
    userId: targetUserId,
  })

  return {
    room: toRoomDto(await repository.findRoomById(roomId), user.id),
  }
}

const setMemberMuted = async (
  user,
  params,
  payload,
  { repository = chatRoomRepository } = {},
) => {
  const roomId = getRoomIdFromParams(params)
  const targetUserId = getTargetUserIdFromParams(params)
  const isMuted = Boolean(payload?.isMuted)

  if (targetUserId === user.id) {
    throw new BadRequestException('You cannot mute yourself')
  }

  const room = await getRoomOrThrow(roomId, repository)
  assertAdmin(room, user.id)
  const targetMembership = getMembershipForUser(room, targetUserId)

  if (!isActiveMember(targetMembership)) {
    throw new NotFoundException('Active room member not found')
  }

  if (targetMembership.role === CHAT_MEMBER_ROLE.ADMIN) {
    throw new BadRequestException('Admins cannot be muted')
  }

  await repository.updateMembership(targetMembership.id, { isMuted })

  return {
    room: toRoomDto(await repository.findRoomById(roomId), user.id),
  }
}

const removeMember = async (
  user,
  params,
  { repository = chatRoomRepository } = {},
) => {
  const roomId = getRoomIdFromParams(params)
  const targetUserId = getTargetUserIdFromParams(params)

  if (targetUserId === user.id) {
    throw new BadRequestException('Admins cannot remove themselves')
  }

  const room = await getRoomOrThrow(roomId, repository)
  assertAdmin(room, user.id)
  const targetMembership = getMembershipForUser(room, targetUserId)

  if (!isActiveMember(targetMembership)) {
    throw new NotFoundException('Active room member not found')
  }

  if (targetMembership.role === CHAT_MEMBER_ROLE.ADMIN) {
    throw new BadRequestException('Admins cannot be kicked')
  }

  await repository.updateMembership(targetMembership.id, {
    isMuted: false,
    status: CHAT_MEMBER_STATUS.KICKED,
  })

  return {
    room: toRoomDto(await repository.findRoomById(roomId), user.id),
  }
}

const listMessages = async (
  user,
  params,
  { repository = chatRoomRepository } = {},
) => {
  const roomId = getRoomIdFromParams(params)
  const room = await getRoomOrThrow(roomId, repository)
  assertActiveMember(room, user.id)

  const messages = await repository.listMessagesForRoom(
    roomId,
    MESSAGE_HISTORY_LIMIT,
  )

  return { messages: messages.reverse().map(toMessageDto) }
}

const listActiveSocketRoomsForUser = async (
  userId,
  { repository = chatRoomRepository } = {},
) => {
  const roomIds = await repository.listActiveRoomIdsForUser(userId)
  return roomIds.map((roomId) => `${CHAT_ROOM_PREFIX}${roomId}`)
}

const listActiveMemberUserIds = (
  roomId,
  { repository = chatRoomRepository } = {},
) => {
  return repository.listActiveMemberUserIdsForRoom(roomId)
}

const parseChatRoomRecipientId = (recipient) => {
  if (typeof recipient !== 'string') return null
  if (!recipient.startsWith(CHAT_ROOM_PREFIX)) return null
  const roomId = Number(recipient.slice(CHAT_ROOM_PREFIX.length))
  return Number.isInteger(roomId) && roomId > 0 ? roomId : null
}

const createMessage = async (
  user,
  { message, recipient },
  { repository = chatRoomRepository } = {},
) => {
  const roomId = parseChatRoomRecipientId(recipient)
  if (!roomId) {
    throw new BadRequestException('Invalid chat room recipient')
  }

  const normalizedMessage = validateMessage(message)
  const room = await getRoomOrThrow(roomId, repository)
  const membership = assertActiveMember(room, user.id)

  if (membership.isMuted) {
    throw new ForbiddenException('You are muted in this chat room')
  }

  const savedMessage = await repository.createMessage({
    message: normalizedMessage,
    roomId,
    userId: user.id,
  })

  return toMessageDto(savedMessage)
}

module.exports = {
  CHAT_ROOM_PREFIX,
  createMessage,
  createRoom,
  inviteUser,
  joinRoom,
  listActiveMemberUserIds,
  listActiveSocketRoomsForUser,
  listMessages,
  listRooms,
  parseChatRoomRecipientId,
  removeMember,
  setMemberMuted,
  toRoomDto,
}
