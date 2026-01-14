import db from '../db/connection.js'

function isValidDate (value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00`)
  return !Number.isNaN(parsed.getTime())
}

function isValidTime (value) {
  if (!value) return true
  if (!/^\d{2}:\d{2}$/.test(value)) return false
  const [hours, minutes] = value.split(':').map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export async function listReminders (req, res) {
  try {
    const userId = req.session.user.id
    const { month } = req.query

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).send({ message: 'invalid month format' })
    }

    const rows = month
      ? await db.all(
        `SELECT id, title, reminder_date, reminder_time, created_at
         FROM reminders
         WHERE user_id = ? AND reminder_date LIKE ?
         ORDER BY reminder_date ASC, reminder_time ASC, id ASC`,
        userId,
        `${month}-%`
      )
      : await db.all(
        `SELECT id, title, reminder_date, reminder_time, created_at
         FROM reminders
         WHERE user_id = ?
         ORDER BY reminder_date ASC, reminder_time ASC, id ASC`,
        userId
      )

    return res.status(200).send({ reminders: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}

export async function createReminder (req, res) {
  try {
    const userId = req.session.user.id
    const title = req.body?.title?.toString().trim()
    const reminderDate = req.body?.date?.toString().trim()
    const reminderTime = req.body?.time ? req.body.time.toString().trim() : null

    if (!title || !reminderDate) {
      return res.status(400).send({ message: 'missing fields' })
    }

    if (title.length > 120) {
      return res.status(400).send({ message: 'title too long' })
    }

    if (!isValidDate(reminderDate)) {
      return res.status(400).send({ message: 'invalid date format' })
    }

    if (!isValidTime(reminderTime)) {
      return res.status(400).send({ message: 'invalid time format' })
    }

    const result = await db.run(
      `INSERT INTO reminders (user_id, title, reminder_date, reminder_time)
       VALUES (?, ?, ?, ?)`,
      userId,
      title,
      reminderDate,
      reminderTime || null
    )

    const reminder = await db.get(
      `SELECT id, title, reminder_date, reminder_time, created_at
       FROM reminders
       WHERE id = ?`,
      result.lastID
    )

    return res.status(201).send({ message: 'reminder created', reminder })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}

export async function deleteReminder (req, res) {
  try {
    const userId = req.session.user.id
    const reminderId = Number(req.params.id)

    if (!reminderId) {
      return res.status(400).send({ message: 'invalid reminder id' })
    }

    const existing = await db.get(
      'SELECT id FROM reminders WHERE id = ? AND user_id = ?',
      reminderId,
      userId
    )

    if (!existing) {
      return res.status(404).send({ message: 'reminder not found' })
    }

    await db.run('DELETE FROM reminders WHERE id = ?', reminderId)
    return res.status(200).send({ message: 'reminder deleted', reminderId })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}
