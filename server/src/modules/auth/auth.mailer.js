const nodemailer = require('nodemailer')
const config = require('#utils/config')
const logger = require('#utils/logger')

const PASSWORD_RESET_SUBJECT = 'Reset your Trackscendence password'

let transporter

const isSmtpConfigured = () => Boolean(config.SMTP_HOST && config.SMTP_FROM)

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
	const expiresInMinutes = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / (60 * 1000)))
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

const sendPasswordResetEmail = async ({ email, resetToken, expiresAt }) => {
	const resetUrl = buildPasswordResetUrl(resetToken)

	if (!isSmtpConfigured()) {
		if (config.NODE_ENV === 'production') {
			throw new Error('SMTP is not configured for password reset delivery')
		}

		logger.warn('SMTP not configured. Password reset link logged for local development.', {
			email,
			resetUrl,
		})

		return {
			delivery: 'log',
			resetUrl,
		}
	}

	const { text, html } = getPasswordResetCopy(resetUrl, expiresAt)
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

module.exports = {
	sendPasswordResetEmail,
}
