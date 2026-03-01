import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  getCurrentUser,
  loginUser,
  registerUser,
  verifyUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  deleteCurrentUser
} from '../controllers/authController.js'
import { listRooms, createRoom, deleteRoom, deleteMessage } from '../controllers/roomController.js'
import { listReminders, createReminder, deleteReminder } from '../controllers/reminderController.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: 'too many auth requests, try again later' },
  standardHeaders: 'draft-8',
  legacyHeaders: false
})


function isLoggedIn (req, res, next) {
    // Central guard for protected API endpoints.
  if (req.session.user) {
    return next()
  }
  res.status(401).send({ message: 'you need to be logged in to access this content' })
}

// Auth endpoints
router.get('/users/id', isLoggedIn, getCurrentUser)
router.post('/api/login', authLimiter, loginUser)
router.post('/api/users', authLimiter, registerUser)
router.post('/api/verify', authLimiter, verifyUser)
router.post('/api/logout', logoutUser)
router.post('/api/password/forgot', authLimiter, requestPasswordReset)
router.post('/api/password/reset', authLimiter, resetPassword)
router.delete('/api/users/me', isLoggedIn, deleteCurrentUser)

// Studyroom endpoints
router.get('/api/rooms', isLoggedIn, listRooms)
router.post('/api/rooms', isLoggedIn, createRoom)
router.delete('/api/rooms/:id', isLoggedIn, deleteRoom)
router.delete('/api/messages/:id', isLoggedIn, deleteMessage)


// Reminder endpoints
router.get('/api/reminders', isLoggedIn, listReminders)
router.post('/api/reminders', isLoggedIn, createReminder)
router.delete('/api/reminders/:id', isLoggedIn, deleteReminder)

export default router
