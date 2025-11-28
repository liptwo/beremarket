import { Server } from 'socket.io'
import { corsOptions } from '~/config/cors'

let io

export const initializeSocket = (server) => {
  io = new Server(server, { cors: corsOptions })

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id)

    // Join a room based on userId
    socket.on('joinRoom', (userId) => {
      socket.join(userId)
      console.log(`User ${socket.id} joined room ${userId}`)
    })

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
