import jwt from 'jsonwebtoken'
import { ENV } from '~/config/environment'

export const socketAuth = (socket, next) => {
  const token = socket.handshake.auth?.token
  // console.log('socketAuth:', token, ': ENv:', ENV.ACCESS_TOKEN_SECRET_SIGNATURE)
  if (!token) {
    console.log('❌ NO_TOKEN')
    return next(new Error('NO_TOKEN'))
  }

  jwt.verify(token, ENV.ACCESS_TOKEN_SECRET_SIGNATURE, (err, decoded) => {
    if (err) {
      console.log('❌ INVALID_TOKEN:', err.message)
      return next(new Error('INVALID_TOKEN'))
    }

    socket.user = decoded
    next()
  })
}
