import auth from '../util/encrypter.js'
import db from '../db/connection.js'
import sendMail from '../util/nodeMailer.js'
import crypto from 'crypto'
import { buildSignupEmail } from '../util/emailPageBuilder.js'

export async function getCurrentUser (req, res) {
  try {
    const result = await db.all('SELECT * FROM users where id = ?', req.session.user.id)
    const user = result[0]

    return res.status(200).send({ username: user.username, email: user.email, role: user.role })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}

export async function loginUser (req, res) {
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
}

export async function registerUser (req, res) {
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

    sendMail(email, 'verify signup', 'welcome to the front soldier', signupHTML)

    return res.status(201).send({ message: 'User created successfully a email has been sent with the verification code' })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}

export async function verifyUser (req, res) {
  try {
    const { verificationCode } = req.body
    const result = await db.all('SELECT * FROM users WHERE verification_code = ?', verificationCode)
    const user = result[0]

    if (result.length === 0 || user.verification_code !== verificationCode) {
      return res.status(401).send({ message: 'incorrect' })
    }

    if (user.verified === 1) {
      return res.status(403).send({ message: 'this user is already verified' })
    }

    await db.run('UPDATE users SET verified = 1 WHERE verification_code = ?', verificationCode)

    return res.status(200).send({ message: 'verification successful' })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: 'server error', error: error.message })
  }
}

export function logoutUser (req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error(err)
      return res.status(500).send({ message: 'failed to log out' })
    }
    res.clearCookie('connect.sid')
    return res.status(200).send({ message: 'logged out' })
  })
}

