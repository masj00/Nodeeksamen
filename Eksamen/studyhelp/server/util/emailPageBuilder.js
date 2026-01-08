import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const signupHTMLPath = path.join(__dirname, 'emailPages', 'signup.html')
const signupHTML = fs.readFileSync(signupHTMLPath, 'utf-8')

const resetHTMLPath = path.join(__dirname, 'emailPages', 'reset.html')
const resetHTML = fs.readFileSync(resetHTMLPath, 'utf-8')

export function buildSignupEmail (username, verificationCode) {
  return signupHTML
    .replace('$$userName$$', username)
    .replace('$$verificationCode$$', verificationCode)
}

export function buildResetEmail (username, token) {
  return resetHTML
    .replace('$$userName$$', username)
    .replace('$$resetToken$$', token)
}
