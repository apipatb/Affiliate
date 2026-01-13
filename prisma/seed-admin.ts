import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

const SALT_ROUNDS = 12

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function main() {
  console.log('Creating/updating admin user...')

  const hashedPassword = await hashPassword(ADMIN_PASSWORD)

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('')
  console.log('=================================')
  console.log('Admin user created/updated!')
  console.log('=================================')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
