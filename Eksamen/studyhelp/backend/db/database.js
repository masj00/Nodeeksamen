import 'dotenv/config'
import db from './connection.js'
import auth from './../util/encrypter.js'

const seedMode = process.argv.includes('seed')

db.exec(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    verification_code TEXT,
    verified INTEGER DEFAULT 0,
    role TEXT DEFAULT 'USER' CHECK(role IN ('ADMIN', 'USER'))
  )`)

if (seedMode) {
  const hashedPassword = await auth.encryptPassword(process.env.ADMIN_PASSWORD)
  db.run(
    'INSERT INTO users (username,password,email,verification_code,verified,role) VALUES (?,?,?,?,?,?)',
    [process.env.ADMIN_USERNAME, hashedPassword, process.env.ADMIN_EMAIL, process.env.ADMIN_CODE, 1, 'ADMIN']
  )
}
