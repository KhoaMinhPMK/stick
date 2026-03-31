// Create admin user for STICK Admin Panel
// Run on VPS: node prisma/seed-admin.js

require('dotenv').config();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  const email = 'admin@stick.app';
  const password = 'StickAdmin2026!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Update role to admin if user exists
    await prisma.user.update({
      where: { email },
      data: { role: 'admin', status: 'active' },
    });
    console.log(`Updated existing user ${email} to admin role`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name: 'STICK Admin',
        isGuest: false,
        role: 'admin',
        status: 'active',
      },
    });
    console.log(`Created admin user: ${email}`);
  }

  console.log('');
  console.log('Admin credentials:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('');
  console.log('Change the password after first login!');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
