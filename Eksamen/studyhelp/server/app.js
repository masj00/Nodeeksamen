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

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
})

registerStudyRoom(io)

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

app.use(express.static('./../client/dist'))

app.use(helmet())

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
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
  res.send({ data: 'hello' })
})

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.resolve('../client/dist/index.html'))
})

app.all('/{*splat}', (req, res) => {
  res.status(404).send({ data: "Didn't match with a route" })
})

const PORT = 8080
server.listen(PORT, () => {
  console.log('Server is running on port:', PORT)
})
