import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const rootDir = path.resolve(import.meta.dirname, '../../../..')
const defaultFilePath = path.join(
  rootDir,
  'tests/postman/users/avatar/fixtures/avatar-valid.png',
)

const filePath = process.argv[2] || defaultFilePath
const baseUrl = (process.argv[3] || 'http://localhost:8080').replace(/\/$/, '')
const apiBaseUrl = `${baseUrl}/api/v1`

const runId = Date.now().toString()
const usernameSuffix = runId.slice(-8)
const email = `avatar.smoke.${runId}@example.com`
const username = `avatarsmoke${usernameSuffix}`
const password = 'Start123!'
let currentStep = ''

const supportsColor = Boolean(process.stdout.isTTY || process.stderr.isTTY)
const COLORS = {
  green: '\u001b[32m',
  red: '\u001b[31m',
  reset: '\u001b[0m',
}

const colorize = (text, color) => {
  if (!supportsColor) {
    return text
  }

  return `${COLORS[color]}${text}${COLORS.reset}`
}

const mimeByExtension = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

const fail = (message, extra) => {
  console.error(
    `\n${colorize('FAIL: Avatar upload smoke check failed', 'red')}`,
  )
  if (currentStep) {
    console.error(`Last step: ${currentStep}`)
  }
  console.error(`Error: ${message}`)
  if (extra) {
    console.error(extra)
  }
  process.exit(1)
}

const printStep = (message) => {
  currentStep = message
  console.log(`\n==> ${message}`)
}

const parseJsonResponse = async (response) => {
  const text = await response.text()

  try {
    return {
      body: JSON.parse(text),
      raw: text,
    }
  } catch {
    return {
      body: null,
      raw: text,
    }
  }
}

const expectStatus = async (response, expectedStatus) => {
  if (response.status === expectedStatus) {
    return
  }

  const { raw } = await parseJsonResponse(response)
  fail(`Unexpected status ${response.status}, expected ${expectedStatus}`, raw)
}

const requestJson = async ({ method, token, url, payload }) => {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  const { body, raw } = await parseJsonResponse(response)

  return {
    body,
    raw,
    response,
  }
}

const requestAvatarUpload = async ({
  fileBuffer,
  fileMimeType,
  fileName,
  token,
}) => {
  const formData = new FormData()
  formData.set(
    'avatar',
    new Blob([fileBuffer], { type: fileMimeType }),
    fileName,
  )

  const response = await fetch(`${apiBaseUrl}/users/me/avatar`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const { body, raw } = await parseJsonResponse(response)

  return {
    body,
    raw,
    response,
  }
}

const expectJsonValue = (actual, expected, label) => {
  if (actual !== expected) {
    fail(`${label} mismatch: expected '${expected}', got '${actual}'`)
  }
}

const main = async () => {
  let fileBuffer

  try {
    fileBuffer = await fs.readFile(filePath)
  } catch (error) {
    fail(`Avatar fixture not found: ${filePath}`, error.message)
  }

  const fileName = path.basename(filePath)
  const fileMimeType = mimeByExtension[path.extname(filePath).toLowerCase()]

  if (!fileMimeType) {
    fail(`Unsupported file extension for smoke check: ${filePath}`)
  }

  printStep('Register test user')
  const registerResult = await requestJson({
    method: 'POST',
    url: `${apiBaseUrl}/auth/register`,
    payload: {
      email,
      username,
      password,
    },
  })
  await expectStatus(registerResult.response, 201)
  expectJsonValue(registerResult.body?.user?.email, email, 'Registered email')
  expectJsonValue(
    registerResult.body?.user?.username,
    username,
    'Registered username',
  )

  printStep('Login test user')
  const loginResult = await requestJson({
    method: 'POST',
    url: `${apiBaseUrl}/auth/login`,
    payload: {
      identifier: email,
      password,
    },
  })
  await expectStatus(loginResult.response, 200)
  const token = loginResult.body?.token

  if (!token) {
    fail('Login did not return a bearer token', loginResult.raw)
  }

  printStep('Upload avatar with fetch multipart/form-data')
  const uploadResult = await requestAvatarUpload({
    fileBuffer,
    fileMimeType,
    fileName,
    token,
  })
  await expectStatus(uploadResult.response, 200)
  const avatarUrl = uploadResult.body?.user?.avatarUrl

  if (!avatarUrl) {
    fail('Avatar upload did not return avatarUrl', uploadResult.raw)
  }

  printStep('Verify auth/me reflects the uploaded avatar')
  const meResult = await requestJson({
    method: 'GET',
    token,
    url: `${apiBaseUrl}/auth/me`,
  })
  await expectStatus(meResult.response, 200)
  expectJsonValue(
    meResult.body?.user?.avatarUrl,
    avatarUrl,
    'auth/me avatarUrl',
  )

  printStep('Verify public profile reflects the uploaded avatar')
  const profileResult = await requestJson({
    method: 'GET',
    url: `${apiBaseUrl}/users/${username}`,
  })
  await expectStatus(profileResult.response, 200)
  expectJsonValue(
    profileResult.body?.user?.avatarUrl,
    avatarUrl,
    'Public profile avatarUrl',
  )

  printStep('Verify the avatar asset is reachable')
  const assetUrl = avatarUrl.startsWith('http')
    ? avatarUrl
    : `${baseUrl}${avatarUrl}`
  const assetResponse = await fetch(assetUrl)
  await expectStatus(assetResponse, 200)

  printStep('Delete avatar')
  const deleteResult = await requestJson({
    method: 'DELETE',
    token,
    url: `${apiBaseUrl}/users/me/avatar`,
  })
  await expectStatus(deleteResult.response, 200)
  expectJsonValue(
    deleteResult.body?.user?.avatarUrl ?? null,
    null,
    'Deleted avatarUrl',
  )

  printStep('Smoke check complete')
  console.log(`Uploaded avatar path was: ${avatarUrl}`)
  console.log(
    `\n${colorize('PASS: Avatar upload smoke check passed', 'green')}`,
  )
}

main().catch((error) => {
  fail(error.message, error.stack)
})
