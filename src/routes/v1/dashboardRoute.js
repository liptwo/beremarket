import express from 'express'
import { dashboardController } from '~/controllers/dashboardController.js'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// API này chỉ dành cho Admin
Router.route('/stats').get(
  authMiddleware.isAuthorized,
  dashboardController.getStats
)

export const dashboardRoute = Router
