import { Router } from 'express'
import auth from './../util/encrypter.js'
import db from '../db/connection.js'
import sendMail from '../util/nodeMailer.js'
import crypto from 'crypto'
import { buildSignupEmail } from '../util/emailPageBuilder.js'
import { rateLimit } from 'express-rate-limit'

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
  res.status(401).send({ message: 'you need to be logged in to acess this content' })
}

router.get('/users/id', isLoggedIn, async (req, res) => {
  try {
    const result = await db.all('SELECT * FROM users where id = ?', req.session.user.id)
    const user = result[0]

    return res.status(200).send({ username: user.username, email: user.email, role: user.role })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
})

router.post('/api/login', async (req, res) => {
  const { password, email } = req.body
  const result = await db.all('SELECT * FROM users WHERE email = ?', email)
  const user = result[0]

  if (result.length === 0 || !auth.validatePassword(password, user.password)) {
    return res.status(401).send({ message: 'incorrect' })
  }

  if (user.verified === 0) {
    return res.status(403).send({ message: 'you are not verified yet' })
  }

  req.session.user = {
    id: user.id,
    name: user.username
  }
  return res.status(200).send({ message: 'login successful' })
})


router.post('/api/users', async (req, res) => {
  try {
    const { username, password, email } = req.body

    if (!username || !password || !email) {
      return res.status(400).send({ message: 'missing fields' })
    }

    const usedEmail = await db.all('SELECT * FROM users WHERE email = ?', email)
    if (usedEmail.length > 0) {
      return res.status(409).send({ message: 'email already in use' })
    }

    const code = crypto.randomBytes(3)
    const verificationCode = code.toString('hex')

    const hashPassword = await auth.encryptPassword(password)

    await db.run(
            `INSERT INTO users (username, password, email, verified, verification_code)
             VALUES (?, ?, ?, 0, ?)`,
            [username, hashPassword, email, verificationCode]
    )

    const signupHTML = buildSignupEmail(username, verificationCode)

    // email needs to be sent
    sendMail(email, 'verify signup', 'welcome to the front soldier', signupHTML)

    return res.status(201).send({ message: 'User created successfully a email has been sent with the ferification code' })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
})

router.post('/api/vaify', async (req, res) => {
  try {
    const { verificationCode } = req.body
    const result = await db.all('SELECT * FROM users WHERE verification_code = ?', verificationCode)
    const user = result[0]

    if (result.length === 0 || user.verification_code !== verificationCode) {
      return res.status(401).send({ message: 'incorrect' })
    }

    if (user.verified === 1) {
      return res.status(403).send({ message: 'this user is allready varified' })
    }

    await db.run('UPDATE users SET verified = 1 WHERE verification_code = ?', verificationCode)

    return res.status(200).send({ message: 'vaification successful' })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
})

export default router
