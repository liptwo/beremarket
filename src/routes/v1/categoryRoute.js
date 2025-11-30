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

// Route to get a single category by ID (public)
Router.route('/:id').get(categoryController.getDetails)

// Route to update a category (protected, admin only)
Router.route('/:id').put(
  authMiddleware.isAuthorized,
  categoryValidation.update,
  categoryController.update
)

// Route to delete a category (soft delete) (protected, admin only)
Router.route('/:id').delete(
  authMiddleware.isAuthorized,
  categoryValidation.deleteItem,
  categoryController.deleteItem
)

export const categoryRoute = Router
