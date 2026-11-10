// Seeds the database with an initial admin user
require('dotenv/config');

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const BCRYPT_COST = 10;

const prisma = new PrismaClient();

async function main() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    throw new Error(
      'Missing required env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME'
    );
  }

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_COST);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: ADMIN_NAME,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
    create: {
      email,
      name: ADMIN_NAME,
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log(`Admin user seeded successfully: ${admin.email} (${admin.id})`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
