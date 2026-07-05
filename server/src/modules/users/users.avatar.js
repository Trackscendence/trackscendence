const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const multer = require('multer')
const BadRequestException = require('#exceptions/bad-request.exception')

const UPLOADS_PUBLIC_PATH_PREFIX = '/uploads'
const AVATAR_PUBLIC_PATH_PREFIX = `${UPLOADS_PUBLIC_PATH_PREFIX}/avatars`
const UPLOADS_ROOT_DIR = path.resolve(__dirname, '../../../uploads')
const AVATAR_UPLOAD_DIR = path.join(UPLOADS_ROOT_DIR, 'avatars')
const AVATAR_FIELD_NAME = 'avatar'
const AVATAR_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

const AVATAR_MIME_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

const isPngSignature = (buffer) => {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
}

const isJpegSignature = (buffer) => {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
}

const getAvatarExtensionFromBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null
  }

  if (isPngSignature(buffer)) {
    return 'png'
  }

  if (isJpegSignature(buffer)) {
    return 'jpg'
  }

  return null
}

const validateAvatarFile = (file) => {
  if (!file) {
    throw new BadRequestException('Avatar file is required')
  }

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new BadRequestException('Avatar file is required')
  }

  const expectedExtension = AVATAR_MIME_TO_EXTENSION[file.mimetype]

  if (!expectedExtension) {
    throw new BadRequestException('Avatar must be a JPEG or PNG image')
  }

  const detectedExtension = getAvatarExtensionFromBuffer(file.buffer)

  if (!detectedExtension) {
    throw new BadRequestException(
      'Avatar file contents must be a valid JPEG or PNG image',
    )
  }

  if (detectedExtension !== expectedExtension) {
    throw new BadRequestException(
      'Avatar file type does not match file contents',
    )
  }

  return {
    extension: detectedExtension,
  }
}

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: AVATAR_MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!AVATAR_MIME_TO_EXTENSION[file.mimetype]) {
      callback(new BadRequestException('Avatar must be a JPEG or PNG image'))
      return
    }

    callback(null, true)
  },
})

const mapAvatarUploadError = (error) => {
  if (!(error instanceof multer.MulterError)) {
    return error
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new BadRequestException('Avatar must not exceed 2 MB')
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new BadRequestException(
      `Avatar upload must use the ${AVATAR_FIELD_NAME} field`,
    )
  }

  return new BadRequestException('Invalid avatar upload')
}

const uploadCurrentUserAvatarFile = (req, res, next) => {
  avatarUpload.single(AVATAR_FIELD_NAME)(req, res, (error) => {
    if (error) {
      next(mapAvatarUploadError(error))
      return
    }

    next()
  })
}

const ensureAvatarUploadDir = async () => {
  await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true })
}

const createAvatarFilename = ({ extension, userId }) => {
  return `${userId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`
}

const buildAvatarPublicUrl = ({ filename }) => {
  return `${AVATAR_PUBLIC_PATH_PREFIX}/${filename}`
}

const getAvatarStoragePathFromUrl = ({ avatarUrl }) => {
  if (typeof avatarUrl !== 'string' || avatarUrl.length === 0) {
    return null
  }

  let avatarPath

  try {
    avatarPath = new URL(avatarUrl, 'http://trackscendence.local').pathname
  } catch {
    return null
  }

  const pathPrefix = `${AVATAR_PUBLIC_PATH_PREFIX}/`

  if (!avatarPath.startsWith(pathPrefix)) {
    return null
  }

  let filename

  try {
    filename = decodeURIComponent(avatarPath.slice(pathPrefix.length))
  } catch {
    return null
  }

  if (!filename || filename !== path.basename(filename)) {
    return null
  }

  return path.join(AVATAR_UPLOAD_DIR, filename)
}

const storeAvatarFile = async ({ file, userId }) => {
  const { extension } = validateAvatarFile(file)

  await ensureAvatarUploadDir()

  const filename = createAvatarFilename({
    extension,
    userId,
  })
  const storagePath = path.join(AVATAR_UPLOAD_DIR, filename)

  await fs.writeFile(storagePath, file.buffer)

  return {
    avatarUrl: buildAvatarPublicUrl({
      filename,
    }),
    storagePath,
  }
}

const deleteAvatarFileByUrl = async ({ avatarUrl }) => {
  const storagePath = getAvatarStoragePathFromUrl({
    avatarUrl,
  })

  if (!storagePath) {
    return false
  }

  try {
    await fs.rm(storagePath)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    }

    throw error
  }
}

module.exports = {
  AVATAR_FIELD_NAME,
  AVATAR_MAX_FILE_SIZE_BYTES,
  AVATAR_PUBLIC_PATH_PREFIX,
  AVATAR_UPLOAD_DIR,
  UPLOADS_PUBLIC_PATH_PREFIX,
  UPLOADS_ROOT_DIR,
  buildAvatarPublicUrl,
  deleteAvatarFileByUrl,
  getAvatarExtensionFromBuffer,
  getAvatarStoragePathFromUrl,
  storeAvatarFile,
  uploadCurrentUserAvatarFile,
  validateAvatarFile,
}
