/**
 * Cria o usuário administrador inicial.
 * Uso: pnpm tsx seed-admin.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL não definido"); process.exit(1); }

const NAME  = process.env.ADMIN_NAME  || "LARF Admin";
const EMAIL = process.env.ADMIN_EMAIL || "admin@larf.com.br";
const PASS  = process.env.ADMIN_PASS  || "larf2024!";

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL!);
  const hash = await bcrypt.hash(PASS, 12);
  const [rows] = await conn.execute("SELECT id FROM users WHERE email = ?", [EMAIL.toLowerCase()]);
  if ((rows as any[]).length > 0) {
    console.log(`✅ Usuário ${EMAIL} já existe.`);
  } else {
    await conn.execute("INSERT INTO users (name, email, passwordHash, role, status) VALUES (?, ?, ?, 'superadmin', 'active')", [NAME, EMAIL.toLowerCase(), hash]);
    console.log(`✅ Admin criado: ${EMAIL} / ${PASS}`);
    console.log("⚠️  Altere a senha após o primeiro login.");
  }
  await conn.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
