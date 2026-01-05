import 'dotenv/config'
import db from './connection.js'
import auth from '../util/encrypter.js'

const seedMode = process.argv.includes('seed')
const clearMode = process.argv.includes('clear')

await db.exec(`CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  verification_code TEXT,
  verified INTEGER DEFAULT 0,
  role TEXT DEFAULT 'USER' CHECK(role IN ('ADMIN', 'USER'))
)`)

await db.exec(`CREATE TABLE IF NOT EXISTS study_rooms(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`)

await db.exec(`CREATE TABLE IF NOT EXISTS study_messages(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  user TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(room_id) REFERENCES study_rooms(id) ON DELETE CASCADE
)`)

await db.run(
  `INSERT OR IGNORE INTO study_rooms (id, name, created_by)
   VALUES (1, 'General', 'System')`
)

if (clearMode) {
  console.log('Clearing tables…')
  await db.run('DELETE FROM study_messages')
  await db.run('DELETE FROM study_rooms')
  await db.run('DELETE FROM sqlite_sequence WHERE name IN ("study_messages", "study_rooms")')
  await db.run('DELETE FROM users')
  await db.run('DELETE FROM sqlite_sequence WHERE name="users"')
  console.log('Tables cleared')
  await db.run(
    `INSERT OR IGNORE INTO study_rooms (id, name, created_by)
     VALUES (1, 'General', 'System')`
  )
}

if (seedMode) {
  const hashedPassword = await auth.encryptPassword(process.env.ADMIN_PASSWORD)
  await db.run(
    `INSERT OR IGNORE INTO users (username, password, email, verification_code, verified, role)
     VALUES (?, ?, ?, ?, 1, 'ADMIN')`,
    process.env.ADMIN_USERNAME,
    hashedPassword,
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_CODE
  )
}
