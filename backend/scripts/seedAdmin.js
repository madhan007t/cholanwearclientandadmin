import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';

export async function ensureAdmin() {
  const { name, email, password } = env.adminSeed;
  if (!email || !password) {
    console.warn('[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set in .env - skipping admin creation.');
    return;
  }
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`[seed] Admin ${email} already exists - left unchanged. (Change the password in Admin > Settings.)`);
    return;
  }
  await Admin.create({ name, email, password, role: 'superadmin' });
  console.log(`[seed] Admin created: ${email}`);
}

// Run directly: `npm run seed:admin`
if (process.argv[1] && process.argv[1].endsWith('seedAdmin.js')) {
  await connectDB();
  try {
    await ensureAdmin();
  } finally {
    await disconnectDB();
  }
}
