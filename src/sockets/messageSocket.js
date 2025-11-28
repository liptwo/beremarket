import { Server } from 'socket.io'
import { corsOptions } from '~/config/cors'
import { JWT_SECRET_KEY } from '~/config/environment'
import jwt from 'jsonwebtoken'

let io

export const initializeSocket = (server) => {
  io = new Server(server, { cors: corsOptions })

  // Middleware xác thực Socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error: Token not provided.'))
    }
    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token.'))
      }
      // Gán thông tin user vào socket để sử dụng sau này
      socket.user = decoded
      next()
    })
  })

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id)

    // Join a room based on userId
    socket.on('joinRoom', (userId) => {
      socket.join(userId)
      console.log(`User ${socket.id} joined room ${userId}`)
    })

    // Tự động join room khi kết nối thành công
    if (socket.user?._id) {
      socket.join(socket.user._id.toString())
      console.log(
        `User ${socket.id} with ID ${socket.user._id} auto-joined their room.`
      )
    }

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}
