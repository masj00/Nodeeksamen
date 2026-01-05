import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
})

async function sendMail (email, subject, text, html) {
  const info = {
    from: {
      name: 'Study Help',
      address: process.env.GMAIL_USER
    },
    to: email,
    subject,
    text,
    html
  }
  try {
    transporter.sendMail(info)
    console.log('Mail sent!')
  } catch (error) {
    console.log('Error sending mail:', error)
  }
}

export default sendMail
