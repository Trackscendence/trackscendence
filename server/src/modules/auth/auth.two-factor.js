const crypto = require('crypto')
const QRCode = require('qrcode')
const { authenticator } = require('otplib')
const config = require('#utils/config')

const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const RECOVERY_CODE_COUNT = 8
const RECOVERY_CODE_SEGMENT_LENGTH = 4
const RECOVERY_CODE_SEGMENTS = 2
const QR_CODE_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 1,
  width: 256,
}

authenticator.options = {
  step: 30,
  window: 1,
}

const getEncryptionKey = () => {
  return crypto
    .createHash('sha256')
    .update(config.TWO_FACTOR_ENCRYPTION_SECRET)
    .digest()
}

const encryptSecret = (value) => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [iv, tag, encrypted]
    .map((part) => part.toString('base64url'))
    .join('.')
}

const decryptSecret = (ciphertext) => {
  const [ivPart, tagPart, encryptedPart] = String(ciphertext || '').split('.')

  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error('Invalid encrypted two-factor secret payload')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivPart, 'base64url'),
  )
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

const generateSecret = () => authenticator.generateSecret()

const normalizeTotpCode = (code) => {
  return typeof code === 'string' ? code.replace(/\s+/g, '').trim() : ''
}

const verifyTotpCode = (secret, code) => {
  const normalizedCode = normalizeTotpCode(code)

  return Boolean(
    normalizedCode && authenticator.check(normalizedCode, String(secret)),
  )
}

const buildOtpauthUrl = ({ accountName, secret }) => {
  return authenticator.keyuri(accountName, config.TWO_FACTOR_ISSUER, secret)
}

const buildQrCodeDataUrl = async (otpauthUrl) => {
  return await QRCode.toDataURL(otpauthUrl, QR_CODE_OPTIONS)
}

const randomAlphabetCharacter = () => {
  const index = crypto.randomInt(0, RECOVERY_CODE_ALPHABET.length)

  return RECOVERY_CODE_ALPHABET[index]
}

const generateRecoveryCode = () => {
  const rawCode = Array.from(
    { length: RECOVERY_CODE_SEGMENT_LENGTH * RECOVERY_CODE_SEGMENTS },
    randomAlphabetCharacter,
  ).join('')
  const segments = rawCode.match(
    new RegExp(`.{1,${RECOVERY_CODE_SEGMENT_LENGTH}}`, 'g'),
  )

  return segments.join('-')
}

const generateRecoveryCodes = () => {
  return Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode)
}

const normalizeRecoveryCode = (code) => {
  return typeof code === 'string'
    ? code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    : ''
}

const hashRecoveryCode = (code) => {
  return crypto
    .createHash('sha256')
    .update(normalizeRecoveryCode(code))
    .digest('hex')
}

module.exports = {
  buildOtpauthUrl,
  buildQrCodeDataUrl,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateSecret,
  hashRecoveryCode,
  normalizeRecoveryCode,
  normalizeTotpCode,
  verifyTotpCode,
}
