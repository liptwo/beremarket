import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'
import { jwtHelper } from '~/helpers/jwt.helper'

export const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Authentication error: Token not provided.'))
    }

    const decoded = jwtHelper.verifyToken(token, env.JWT_SECRET)
    if (!decoded || !decoded._id) {
      return next(new Error('Authentication error: Invalid token.'))
    }

    // Gán thông tin user vào socket để sử dụng sau này
    socket.user = decoded
    // Cho socket tham gia vào phòng riêng của user
    socket.join(decoded._id.toString())
    next()
  } catch (error) {
    next(new Error('Authentication error: ' + error.message))
  }
}
