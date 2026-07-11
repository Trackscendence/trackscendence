const nodemailer = require('nodemailer')
const config = require('#utils/config')
const logger = require('#utils/logger')

const BREVO_EMAIL_API_URL = 'https://api.brevo.com/v3/smtp/email'
const BREVO_SENDER_NAME = 'Trackscendence'
const PASSWORD_RESET_SUBJECT = 'Reset your Trackscendence password'

let transporter

const hasBrevoConfig = () =>
  Boolean(config.BREVO_API_KEY || config.BREVO_SENDER)

const isBrevoConfigured = () =>
  Boolean(config.BREVO_API_KEY && config.BREVO_SENDER)

const isSmtpConfigured = () => Boolean(config.SMTP_HOST && config.SMTP_FROM)

const hasSmtpConfig = () =>
  Boolean(
    config.SMTP_HOST ||
    config.SMTP_FROM ||
    config.SMTP_USER ||
    config.SMTP_PASS,
  )

const assertBrevoConfigured = () => {
  if (!hasBrevoConfig()) return

  if (!isBrevoConfigured()) {
    throw new Error(
      'Brevo delivery requires both BREVO_API_KEY and BREVO_SENDER',
    )
  }
}

const assertSmtpConfigured = () => {
  if (!hasSmtpConfig()) return

  if (!isSmtpConfigured()) {
    throw new Error('SMTP delivery requires both SMTP_HOST and SMTP_FROM')
  }
}

const getSmtpAuth = () => {
  if (!config.SMTP_USER && !config.SMTP_PASS) {
    return undefined
  }

  if (!config.SMTP_USER || !config.SMTP_PASS) {
    throw new Error('SMTP authentication requires both SMTP_USER and SMTP_PASS')
  }

  return {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  }
}

const getTransporter = () => {
  if (!transporter) {
    const auth = getSmtpAuth()

    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      ...(auth ? { auth } : {}),
    })
  }

  return transporter
}

const buildPasswordResetUrl = (resetToken) => {
  const resetUrl = new URL(config.PASSWORD_RESET_URL_BASE)
  resetUrl.searchParams.set('token', resetToken)

  return resetUrl.toString()
}

const getPasswordResetCopy = (resetUrl, expiresAt) => {
  const expiresInMinutes = Math.max(
    1,
    Math.round((expiresAt.getTime() - Date.now()) / (60 * 1000)),
  )
  const text = [
    'You requested a password reset for your Trackscendence account.',
    `Use this link to choose a new password: ${resetUrl}`,
    `This link expires in ${expiresInMinutes} minutes.`,
    'If you did not request this change, you can ignore this email.',
  ].join('\n\n')
  const html = [
    '<p>You requested a password reset for your Trackscendence account.</p>',
    `<p><a href="${resetUrl}">Reset your password</a></p>`,
    `<p>This link expires in ${expiresInMinutes} minutes.</p>`,
    '<p>If you did not request this change, you can ignore this email.</p>',
  ].join('')

  return { text, html }
}

const sendViaBrevo = async ({ email, html, text }) => {
  const response = await fetch(BREVO_EMAIL_API_URL, {
    method: 'POST',
    headers: {
      'api-key': config.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: BREVO_SENDER_NAME,
        email: config.BREVO_SENDER,
      },
      to: [{ email }],
      subject: PASSWORD_RESET_SUBJECT,
      htmlContent: html,
      textContent: text,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Brevo email delivery failed: ${response.status} ${response.statusText}${
        errorBody ? ` - ${errorBody}` : ''
      }`,
    )
  }

  const body = await response.json()

  logger.info('Password reset email sent', {
    email,
    messageId: body.messageId || null,
  })

  return {
    delivery: 'brevo',
    messageId: body.messageId || null,
  }
}

const sendViaSmtp = async ({ email, html, text }) => {
  const info = await getTransporter().sendMail({
    from: config.SMTP_FROM,
    to: email,
    subject: PASSWORD_RESET_SUBJECT,
    text,
    html,
  })

  logger.info('Password reset email sent', {
    email,
    messageId: info.messageId,
  })

  return {
    delivery: 'smtp',
    messageId: info.messageId,
  }
}

const sendPasswordResetEmail = async ({ email, resetToken, expiresAt }) => {
  const resetUrl = buildPasswordResetUrl(resetToken)
  const { text, html } = getPasswordResetCopy(resetUrl, expiresAt)

  assertBrevoConfigured()
  assertSmtpConfigured()

  if (isBrevoConfigured()) {
    return sendViaBrevo({ email, html, text })
  }

  if (isSmtpConfigured()) {
    return sendViaSmtp({ email, html, text })
  }

  if (config.NODE_ENV === 'production') {
    throw new Error(
      'Password reset email delivery is not configured (set Brevo or SMTP)',
    )
  }

  logger.warn(
    'Email delivery not configured. Password reset link logged for local development.',
    {
      email,
      resetUrl,
    },
  )

  return {
    delivery: 'log',
    resetUrl,
  }
}

module.exports = {
  sendPasswordResetEmail,
}
