import bcrypt from 'bcryptjs'

export async function encryptPassword (password) {
  if (typeof password !== 'string') {
    throw new Error('password is not a string yo')
  }

  const encryptedPassword = await bcrypt.hash(password, 15)

  return encryptedPassword
}

function validatePassword (password, hash) {
  if (typeof password !== 'string') {
    throw new Error('password is not a string')
  }
  return bcrypt.compare(password, hash)
}

export default {
  encryptPassword,
  validatePassword
}
