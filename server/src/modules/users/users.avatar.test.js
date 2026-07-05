const test = require('node:test')
const assert = require('node:assert/strict')
const BadRequestException = require('#exceptions/bad-request.exception')
const {
  buildAvatarPublicUrl,
  getAvatarExtensionFromBuffer,
  getAvatarStoragePathFromUrl,
  validateAvatarFile,
} = require('#modules/users/users.avatar')

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
])

const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])

test('getAvatarExtensionFromBuffer detects PNG signatures', () => {
  assert.equal(getAvatarExtensionFromBuffer(PNG_BUFFER), 'png')
})

test('getAvatarExtensionFromBuffer detects JPEG signatures', () => {
  assert.equal(getAvatarExtensionFromBuffer(JPEG_BUFFER), 'jpg')
})

test('validateAvatarFile accepts matching PNG mime type and contents', () => {
  assert.deepEqual(
    validateAvatarFile({
      buffer: PNG_BUFFER,
      mimetype: 'image/png',
    }),
    { extension: 'png' },
  )
})

test('validateAvatarFile rejects missing files', () => {
  assert.throws(
    () => validateAvatarFile(null),
    (error) =>
      error instanceof BadRequestException &&
      error.message === 'Avatar file is required',
  )
})

test('validateAvatarFile rejects mismatched mime type and file signature', () => {
  assert.throws(
    () =>
      validateAvatarFile({
        buffer: PNG_BUFFER,
        mimetype: 'image/jpeg',
      }),
    (error) =>
      error instanceof BadRequestException &&
      error.message === 'Avatar file type does not match file contents',
  )
})

test('validateAvatarFile rejects non-image binary payloads', () => {
  assert.throws(
    () =>
      validateAvatarFile({
        buffer: Buffer.from('not-an-image'),
        mimetype: 'image/png',
      }),
    (error) =>
      error instanceof BadRequestException &&
      error.message ===
        'Avatar file contents must be a valid JPEG or PNG image',
  )
})

test('getAvatarStoragePathFromUrl resolves local avatar paths for known URLs', () => {
  const avatarUrl = buildAvatarPublicUrl({
    filename: 'user-avatar.png',
  })
  const storagePath = getAvatarStoragePathFromUrl({
    avatarUrl,
  })

  assert.match(storagePath, /uploads\/avatars\/user-avatar\.png$/)
})

test('getAvatarStoragePathFromUrl accepts same-path absolute URLs and blocks traversal payloads', () => {
  const storagePath = getAvatarStoragePathFromUrl({
    avatarUrl: 'http://cdn.example.com/uploads/avatars/user-avatar.png',
  })

  assert.match(storagePath, /uploads\/avatars\/user-avatar\.png$/)

  assert.equal(
    getAvatarStoragePathFromUrl({
      avatarUrl: 'http://localhost:3001/uploads/avatars/../secrets.txt',
    }),
    null,
  )
})
