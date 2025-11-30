import { Server } from 'socket.io'
import { corsOptions } from '~/config/cors'
import { socketAuth } from '~/middlewares/socketAuthMiddleware'

let io

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
  })

  // dùng middleware
  io.use(socketAuth)

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id, socket.user._id)

    const roomId = socket.user._id.toString()

    // auto join room user
    socket.join(roomId)

    socket.on('joinRoom', (room) => {
      socket.join(room)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!')
  return io
}
