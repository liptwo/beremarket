/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import { connectToDatabase, EXIT_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { ENV } from './config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from '~/config/cors'
import cookieParser from 'cookie-parser'
import { initializeSocket } from '~/sockets/messageSocket'
import http from 'http'

const START_SEVER = () => {
  const app = express()
  const server = http.createServer(app)
  initializeSocket(server)

  // fix cache from disk của express js
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Cấu hình cookie parser
  app.use(cookieParser())

  // xử lý cors
  app.use(cors(corsOptions))

  // enable req.body json data
  app.use(express.json())

  app.use('/v1', APIs_V1)
  // app.use(express.urlencoded({ extended: true }))

  app.get('/', (req, res) => {
    res.end('<h1>Hello World!</h1><hr>')
  })

  // midleware xử lý lỗi tập trung
  app.use(errorHandlingMiddleware)

  if (ENV.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
      console.log(
        `Hello Liptwo, I on Production am running at ${process.env.PORT}/`
      )
    })
  } else {
    server.listen(ENV.LOCAL_DEV_APP_PORT, ENV.LOCAL_DEV_APP_HOST, () => {
      console.log(
        `Hello Liptwo, I am running at http://${ENV.LOCAL_DEV_APP_HOST}:${ENV.LOCAL_DEV_APP_PORT}/`
      )
    })
  }

  exitHook(() => {
    console.log('Exit db')
    EXIT_DB()
  })
}

;(async () => {
  try {
    console.log('1. Connecting to database...')
    await connectToDatabase() // Make sure to await this
    console.log('2. Successfully connected to database!')
    START_SEVER()
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1) // Use exit code 1 for errors
  }
})()
