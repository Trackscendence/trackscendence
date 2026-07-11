const { afterEach, describe, it } = require('node:test')
const assert = require('node:assert/strict')

const config = require('#utils/config')
const logger = require('#utils/logger')
const nodemailer = require('nodemailer')

const mailerPath = require.resolve('./auth.mailer')

const originalConfig = {
  BREVO_API_KEY: config.BREVO_API_KEY,
  BREVO_SENDER: config.BREVO_SENDER,
  NODE_ENV: config.NODE_ENV,
  PASSWORD_RESET_URL_BASE: config.PASSWORD_RESET_URL_BASE,
  SMTP_FROM: config.SMTP_FROM,
  SMTP_HOST: config.SMTP_HOST,
  SMTP_PASS: config.SMTP_PASS,
  SMTP_PORT: config.SMTP_PORT,
  SMTP_SECURE: config.SMTP_SECURE,
  SMTP_USER: config.SMTP_USER,
}

const originalCreateTransport = nodemailer.createTransport
const originalFetch = global.fetch
const originalInfo = logger.info
const originalWarn = logger.warn

const loadMailer = () => {
  delete require.cache[mailerPath]
  return require('./auth.mailer')
}

const resetConfig = () => {
  Object.assign(config, originalConfig)
}

afterEach(() => {
  resetConfig()
  nodemailer.createTransport = originalCreateTransport
  global.fetch = originalFetch
  logger.info = originalInfo
  logger.warn = originalWarn
  delete require.cache[mailerPath]
})

describe('authMailer.sendPasswordResetEmail', () => {
  it('uses Brevo HTTP delivery when Brevo is configured', async () => {
    config.NODE_ENV = 'production'
    config.PASSWORD_RESET_URL_BASE = 'https://trackscendence.app/reset-password'
    config.BREVO_API_KEY = 'brevo-key'
    config.BREVO_SENDER = 'no-reply@example.com'
    config.SMTP_HOST = ''
    config.SMTP_FROM = ''
    config.SMTP_USER = ''
    config.SMTP_PASS = ''

    let request = null
    let logEntry = null
    nodemailer.createTransport = () => {
      throw new Error('SMTP should not be used when Brevo is configured')
    }
    logger.info = (message, payload) => {
      logEntry = { message, payload }
    }
    global.fetch = async (url, init) => {
      request = { init, url }
      return {
        ok: true,
        json: async () => ({ messageId: 'brevo-123' }),
      }
    }

    const { sendPasswordResetEmail } = loadMailer()
    const result = await sendPasswordResetEmail({
      email: 'player@example.com',
      resetToken: 'token-id.token-secret',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })

    assert.equal(result.delivery, 'brevo')
    assert.equal(result.messageId, 'brevo-123')
    assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email')
    assert.equal(request.init.method, 'POST')
    assert.equal(request.init.headers['api-key'], 'brevo-key')

    const body = JSON.parse(request.init.body)
    assert.deepEqual(body.sender, {
      name: 'Trackscendence',
      email: 'no-reply@example.com',
    })
    assert.deepEqual(body.to, [{ email: 'player@example.com' }])
    assert.equal(body.subject, 'Reset your Trackscendence password')
    assert.match(body.textContent, /token-id\.token-secret/)
    assert.match(body.htmlContent, /Reset your password/)
    assert.deepEqual(logEntry, {
      message: 'Password reset email sent',
      payload: {
        email: 'player@example.com',
        messageId: 'brevo-123',
      },
    })
  })

  it('uses SMTP delivery when Brevo is absent and SMTP is configured', async () => {
    config.NODE_ENV = 'production'
    config.PASSWORD_RESET_URL_BASE = 'https://trackscendence.app/reset-password'
    config.BREVO_API_KEY = ''
    config.BREVO_SENDER = ''
    config.SMTP_HOST = 'mailpit'
    config.SMTP_PORT = 1025
    config.SMTP_SECURE = false
    config.SMTP_USER = ''
    config.SMTP_PASS = ''
    config.SMTP_FROM = 'Trackscendence <no-reply@trackscendence.local>'

    let sentMail = null
    global.fetch = async () => {
      throw new Error('Brevo should not be called when SMTP is selected')
    }
    nodemailer.createTransport = () => ({
      sendMail: async (options) => {
        sentMail = options
        return { messageId: 'smtp-123' }
      },
    })

    const { sendPasswordResetEmail } = loadMailer()
    const result = await sendPasswordResetEmail({
      email: 'player@example.com',
      resetToken: 'token-id.token-secret',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })

    assert.equal(result.delivery, 'smtp')
    assert.equal(result.messageId, 'smtp-123')
    assert.equal(
      sentMail.from,
      'Trackscendence <no-reply@trackscendence.local>',
    )
    assert.equal(sentMail.to, 'player@example.com')
    assert.equal(sentMail.subject, 'Reset your Trackscendence password')
    assert.match(sentMail.text, /token-id\.token-secret/)
  })

  it('falls back to logging in non-production when no delivery transport is configured', async () => {
    config.NODE_ENV = 'development'
    config.PASSWORD_RESET_URL_BASE = 'http://localhost:8080/reset-password'
    config.BREVO_API_KEY = ''
    config.BREVO_SENDER = ''
    config.SMTP_HOST = ''
    config.SMTP_FROM = ''
    config.SMTP_USER = ''
    config.SMTP_PASS = ''

    let warning = null
    logger.warn = (message, payload) => {
      warning = { message, payload }
    }

    const { sendPasswordResetEmail } = loadMailer()
    const result = await sendPasswordResetEmail({
      email: 'player@example.com',
      resetToken: 'token-id.token-secret',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })

    assert.equal(result.delivery, 'log')
    assert.match(result.resetUrl, /token=token-id\.token-secret/)
    assert.deepEqual(warning, {
      message:
        'Email delivery not configured. Password reset link logged for local development.',
      payload: {
        email: 'player@example.com',
        resetUrl: result.resetUrl,
      },
    })
  })

  it('throws in production when neither Brevo nor SMTP is configured', async () => {
    config.NODE_ENV = 'production'
    config.BREVO_API_KEY = ''
    config.BREVO_SENDER = ''
    config.SMTP_HOST = ''
    config.SMTP_FROM = ''
    config.SMTP_USER = ''
    config.SMTP_PASS = ''

    const { sendPasswordResetEmail } = loadMailer()

    await assert.rejects(
      () =>
        sendPasswordResetEmail({
          email: 'player@example.com',
          resetToken: 'token-id.token-secret',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }),
      /Password reset email delivery is not configured/,
    )
  })

  it('rejects partial Brevo configuration instead of silently falling back', async () => {
    config.NODE_ENV = 'production'
    config.BREVO_API_KEY = 'brevo-key'
    config.BREVO_SENDER = ''
    config.SMTP_HOST = 'mailpit'
    config.SMTP_FROM = 'Trackscendence <no-reply@trackscendence.local>'

    const { sendPasswordResetEmail } = loadMailer()

    await assert.rejects(
      () =>
        sendPasswordResetEmail({
          email: 'player@example.com',
          resetToken: 'token-id.token-secret',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }),
      /BREVO_API_KEY and BREVO_SENDER/,
    )
  })
})
