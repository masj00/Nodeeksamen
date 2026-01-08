import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  getCurrentUser,
  loginUser,
  registerUser,
  verifyUser,
  logoutUser,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController.js'
import { listRooms, createRoom, deleteRoom } from '../controllers/roomController.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false
})

router.use(authLimiter)

function isLoggedIn (req, res, next) {
  if (req.session.user) {
    return next()
  }
  res.status(401).send({ message: 'you need to be logged in to access this content' })
}

// Auth endpoints
router.get('/users/id', isLoggedIn, getCurrentUser)
router.post('/api/login', loginUser)
router.post('/api/users', registerUser)
router.post('/api/vaify', verifyUser)
router.post('/api/logout', logoutUser)
router.post('/api/password/forgot', requestPasswordReset)
router.post('/api/password/reset', resetPassword)

// Study room endpoints
router.get('/api/rooms', isLoggedIn, listRooms)
router.post('/api/rooms', isLoggedIn, createRoom)
router.delete('/api/rooms/:id', isLoggedIn, deleteRoom)

export default router
