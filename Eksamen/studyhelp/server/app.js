import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouthes from './routers/authRoutes.js'
import path from 'path'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import session from 'express-session'
import http from 'http'
import { Server } from 'socket.io'
import registerStudyRoom from './socket/studyRoom.js'

const app = express()
const server = http.createServer(app)
const CLIENT_DIST_PATH = path.resolve('../client/dist')
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const isProduction = process.env.NODE_ENV === 'production'

// Socket server used by the study room page.
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true
  }
})

registerStudyRoom(io)

// Allow session cookie from the frontend origin.
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}))

app.use(express.json())

app.use(express.static(CLIENT_DIST_PATH))

app.use(helmet())

// Session is required for auth/authorization checks on protected routes.
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax'
  }
}))

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56
})

app.use(generalLimiter)

app.use(authRouthes)

app.get('/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'))
})

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'))
})

app.all('/{*splat}', (req, res) => {
  res.status(404).send({ data: "Didn't match with a route" })
})

const PORT = 8080
server.listen(PORT, () => {
  console.log('Server is running on port:', PORT)
})
