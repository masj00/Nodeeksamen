import db from '../db/connection.js'

export async function listRooms (req, res) {
  try {
    const rooms = await db.all(
      `SELECT id, name, created_by, created_at
       FROM study_rooms
       ORDER BY id ASC`
    )
    return res.status(200).send({ rooms })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}

export async function createRoom (req, res) {
  try {
    const { name } = req.body
    const trimmedName = name?.toString().trim()

    if (!trimmedName) {
      return res.status(400).send({ message: 'room name required' })
    }

    if (trimmedName.length > 40) {
      return res.status(400).send({ message: 'room name too long' })
    }

    const existing = await db.get('SELECT id FROM study_rooms WHERE LOWER(name) = LOWER(?)', trimmedName)
    if (existing) {
      return res.status(409).send({ message: 'room name already exists' })
    }

    const result = await db.run(
      `INSERT INTO study_rooms (name, created_by)
       VALUES (?, ?)`,
      trimmedName,
      req.session.user?.name || 'Unknown'
    )

    const room = await db.get(
      `SELECT id, name, created_by, created_at
       FROM study_rooms
       WHERE id = ?`,
      result.lastID
    )

    return res.status(201).send({ message: 'room created', room })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}

export async function deleteRoom (req, res) {
  try {
    const roomId = Number(req.params.id)
    if (!roomId) {
      return res.status(400).send({ message: 'invalid room id' })
    }
        // Authorization example: only admins can delete rooms.
    const user = await db.get('SELECT role FROM users WHERE id = ?', req.session.user.id)
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).send({ message: 'only admins can delete rooms' })
    }

    const existing = await db.get('SELECT id FROM study_rooms WHERE id = ?', roomId)
    if (!existing || roomId === 1) {
      return res.status(404).send({ message: 'room not found' })
    }

    await db.run('DELETE FROM study_rooms WHERE id = ?', roomId)
    return res.status(200).send({ message: 'room deleted', roomId })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}
