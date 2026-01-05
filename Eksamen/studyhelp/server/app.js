import 'dotenv/config'
import express from 'express'
import cors from 'cors';
import authRouthes from './routers/authRoutes.js'
import path from 'path'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import session from 'express-session'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
})

const studyMessages = []

io.on('connection', socket => {
  console.log('socket connected', socket.id) //skal væk senere

  socket.emit('study:history', studyMessages)

  socket.on('study:message', payload => {
    if (!payload || typeof payload.text !== 'string') {
      return
    }

    const trimmedText = payload.text.trim()
    if (trimmedText.length === 0) {
      return
    }

    const cleanMessage = {
      id: Date.now(),
      user: (payload.user && payload.user.toString().slice(0, 40)) || 'Anonymous',
      text: trimmedText.slice(0, 400),
      createdAt: new Date().toISOString()
    }

    studyMessages.push(cleanMessage)
    if (studyMessages.length > 20) {
      studyMessages.shift()
    }

    io.emit('study:message', cleanMessage)
  })

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id) //skal væk senere
  })
})


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));


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
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56 // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
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
