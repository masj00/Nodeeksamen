import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// open the database
const connection = await open({
  filename: 'database.db',
  driver: sqlite3.Database
})

await connection.exec('PRAGMA foreign_keys = ON')

export default connection
