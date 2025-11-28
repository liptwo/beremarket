import express from 'express'
const Router = express.Router()
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute.js'
import { listingRoute } from './listingRoute.js'
import { categoryRoute } from './categoryRoute.js'
import { reviewRoute } from './reviewRoute.js'
import { messageRoute } from './messageRoute.js'
import { dashboardRoute } from './dashboardRoute.js'

// api v1 status
Router.get('/', (req, res) => {
  res.send('<h1>Bird Home Page</h1><hr>')
})
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'ok',
    message: 'Route service is running'
  })
})

/** User APIs */
Router.use('/users', userRoute)

/** Listing APIs */
Router.use('/listings', listingRoute)

/** Category APIs */
Router.use('/categories', categoryRoute)

/** Review APIs */
Router.use('/reviews', reviewRoute)

/** Message APIs */
Router.use('/messages', messageRoute)

Router.use('/dashboard', dashboardRoute)

export const APIs_V1 = Router
