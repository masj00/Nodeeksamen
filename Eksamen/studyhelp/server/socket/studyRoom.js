import db from '../db/connection.js'

const MAX_MESSAGES = 30
const socketSessions = new Map()
const presenceByRoom = new Map()

function getPresenceMap (roomId) {
  if (!presenceByRoom.has(roomId)) {
    presenceByRoom.set(roomId, new Map())
  }
  return presenceByRoom.get(roomId)
}

function mapRow (row) {
  if (!row) return null
  return {
    id: row.id,
    roomId: row.room_id,
    user: row.user,
    text: row.text,
    createdAt: row.created_at
  }
}

async function fetchRecentMessages (roomId) {
  const rows = await db.all(
    `SELECT id, room_id, user, text, created_at
     FROM study_messages
     WHERE room_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    roomId,
    MAX_MESSAGES
  )
  return rows.reverse().map(mapRow)
}

async function saveMessage (roomId, username, text) {
  const trimmed = text.trim().slice(0, 400)
  const result = await db.run(
    `INSERT INTO study_messages (room_id, user, text)
     VALUES (?, ?, ?)`,
    roomId,
    username,
    trimmed
  )
  const row = await db.get(
    `SELECT id, room_id, user, text, created_at
     FROM study_messages
     WHERE id = ?`,
    result.lastID
  )
  await db.run(
    `DELETE FROM study_messages
     WHERE room_id = ?
       AND id NOT IN (
         SELECT id FROM study_messages
         WHERE room_id = ?
         ORDER BY id DESC
         LIMIT ?
       )`,
    roomId,
    roomId,
    MAX_MESSAGES
  )
  return mapRow(row)
}

async function roomExists (roomId) {
  return db.get(
    `SELECT id, name
     FROM study_rooms
     WHERE id = ?`,
    roomId
  )
}

function broadcastPresence (io, roomId) {
  const presence = Array.from(getPresenceMap(roomId).values())
  io.to(roomChannel(roomId)).emit('study:presence', {
    roomId,
    participants: presence
  })
}

function roomChannel (roomId) {
  return `study-room:${roomId}`
}

export default function registerStudyRoom (io) {
  io.on('connection', socket => {
    socket.on('study:join', async payload => {
      try {
        const roomId = Number(payload?.roomId)
        const username =
          (payload?.user && payload.user.toString().trim().slice(0, 40)) || 'Student'

        if (!roomId) {
          socket.emit('study:error', { message: 'Room id missing' })
          return
        }

        const room = await roomExists(roomId)
        if (!room) {
          socket.emit('study:error', { message: 'Room not found' })
          return
        }

        socket.join(roomChannel(room.id))

        socketSessions.set(socket.id, { roomId: room.id, username })

        const presence = getPresenceMap(room.id)
        presence.set(socket.id, { id: socket.id, username })

        const history = await fetchRecentMessages(room.id)
        socket.emit('study:history', { roomId: room.id, messages: history })
        broadcastPresence(io, room.id)
      } catch (error) {
        console.error('study:join error', error)
        socket.emit('study:error', { message: 'Failed to join room' })
      }
    })

    socket.on('study:message', async payload => {
      try {
        const context = socketSessions.get(socket.id)
        if (!context) {
          socket.emit('study:error', { message: 'Join a room first' })
          return
        }

        const text = payload?.text?.toString().trim()
        if (!text) {
          return
        }

        const saved = await saveMessage(context.roomId, context.username, text)
        if (saved) {
          io.to(roomChannel(context.roomId)).emit('study:message', {
            roomId: context.roomId,
            message: saved
          })
        }
      } catch (error) {
        console.error('study:message error', error)
        socket.emit('study:error', { message: 'Failed to send message' })
      }
    })

    socket.on('disconnect', () => {
      const context = socketSessions.get(socket.id)
      if (!context) {
        return
      }
      const presence = getPresenceMap(context.roomId)
      presence.delete(socket.id)
      socketSessions.delete(socket.id)
      broadcastPresence(io, context.roomId)
    })
  })
}
