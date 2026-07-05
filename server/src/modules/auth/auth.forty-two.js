const config = require('#utils/config')
const logger = require('#utils/logger')

const AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize'
const TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
const PROFILE_URL = 'https://api.intra.42.fr/v2/me'

const isConfigured = () => {
  return Boolean(
    config.FORTYTWO_CLIENT_ID &&
    config.FORTYTWO_CLIENT_SECRET &&
    config.FORTYTWO_REDIRECT_URI,
  )
}

const buildAuthorizeUrl = (state) => {
  const url = new URL(AUTHORIZE_URL)

  url.searchParams.set('client_id', config.FORTYTWO_CLIENT_ID)
  url.searchParams.set('redirect_uri', config.FORTYTWO_REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'public')
  url.searchParams.set('state', state)

  return url.toString()
}

const exchangeCodeForAccessToken = async (code) => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.FORTYTWO_CLIENT_ID,
      client_secret: config.FORTYTWO_CLIENT_SECRET,
      code,
      redirect_uri: config.FORTYTWO_REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    logger.warn('42 OAuth code exchange failed', { status: response.status })
    return null
  }

  const body = await response.json()

  return typeof body?.access_token === 'string' ? body.access_token : null
}

const fetchProfile = async (accessToken) => {
  const response = await fetch(PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    logger.warn('42 OAuth profile fetch failed', { status: response.status })
    return null
  }

  return await response.json()
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCodeForAccessToken,
  fetchProfile,
  isConfigured,
}
