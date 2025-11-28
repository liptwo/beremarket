import express from 'express'
import { categoryController } from '~/controllers/categoryController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { categoryValidation } from '~/validations/categoryValidation'

const Router = express.Router()

// Route to get all categories (public)
Router.route('/').get(categoryController.getCategories)

// Route to create a new category (protected, admin only)
Router.route('/').post(
  authMiddleware.isAuthorized,
  categoryValidation.createNew,
  categoryController.createNew
)

export const categoryRoute = Router
