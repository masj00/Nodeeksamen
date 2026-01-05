import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const signupHTMLPath = path.join(__dirname, 'emailPages', 'signup.html')
const signupHTML = fs.readFileSync(signupHTMLPath, 'utf-8')

export function buildSignupEmail (username, verificationCode) {
  return signupHTML
    .replace('$$userName$$', username)
    .replace('$$verificationCode$$', verificationCode)
}
