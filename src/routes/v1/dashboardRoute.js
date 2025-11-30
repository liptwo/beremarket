import express from 'express'
import { dashboardController } from '~/controllers/dashboardController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// Route to get all dashboard stats (protected, admin only)
Router.route('/stats').get(
  authMiddleware.isAuthorized,
  dashboardController.getStats
)

export const dashboardRoute = Router
