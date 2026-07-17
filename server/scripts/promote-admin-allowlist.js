const config = require('#utils/config')
const prisma = require('#db/prisma')
const authRepository = require('#modules/auth/auth.repository')

const backfillAllowlistedAdmins = async () => {
  let promotedCount = 0

  for (const email of config.ADMIN_EMAILS) {
    const user = await authRepository.findByEmail(email)

    if (!user || user.role === 'ADMIN') {
      continue
    }

    await authRepository.promoteAllowlistedAdmin(user.id)
    promotedCount += 1
  }

  return promotedCount
}

backfillAllowlistedAdmins()
  .then((promotedCount) => {
    process.stdout.write(
      `Promoted ${promotedCount} allowlisted administrator(s)\n`,
    )
  })
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
