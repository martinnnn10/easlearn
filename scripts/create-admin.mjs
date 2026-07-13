/**
 * Create (or promote) a platform admin account.
 *
 * Usage:
 *   node scripts/create-admin.mjs                       # uses the defaults below
 *   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/create-admin.mjs
 *
 * Grants role=admin (full access to the entire platform) + an active team tier.
 * If the email already exists it's promoted and its password reset; otherwise a
 * new verified admin user is created. Password is bcrypt-hashed (never stored raw).
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';

const EMAIL = process.env.ADMIN_EMAIL || 'eas@eautomatedstaffing.com';
const PASSWORD = process.env.ADMIN_PASSWORD || '1234';
const NAME = process.env.ADMIN_NAME || 'EAS Admin';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);
const passwordHash = await hash(PASSWORD, 10);

const [rows] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [EMAIL]);

if (Array.isArray(rows) && rows.length > 0) {
  await conn.execute(
    `UPDATE users
       SET passwordHash = ?, role = 'admin', emailVerified = 1, loginMethod = 'email',
           subscriptionTier = 'team', subscriptionStatus = 'active'
     WHERE email = ?`,
    [passwordHash, EMAIL],
  );
  console.log(`Promoted existing user to admin: ${EMAIL}`);
} else {
  const openId = `admin_${nanoid(24)}`;
  await conn.execute(
    `INSERT INTO users
       (openId, name, email, passwordHash, emailVerified, loginMethod, role, subscriptionTier, subscriptionStatus)
     VALUES (?, ?, ?, ?, 1, 'email', 'admin', 'team', 'active')`,
    [openId, NAME, EMAIL, passwordHash],
  );
  console.log(`Created new admin user: ${EMAIL}`);
}

console.log(`Login with email "${EMAIL}" and the password you set. Change this password after first login.`);
await conn.end();
