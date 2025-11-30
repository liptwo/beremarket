import express from 'express'
const Router = express.Router()
import { userValidation } from '~/validations/userValidation.js'
import { userController } from '~/controllers/userController.js'
import { authMiddleware } from '~/middlewares/authMiddleware.js'
import { multerUploadMiddlewares } from '~/middlewares/multerUploadMiddlewares.js'

Router.route('/register').post(
  userValidation.createNew,
  userController.createNew
)

Router.route('/verify').put(
  userValidation.verifyAccount,
  userController.verifyAccount
)

Router.route('/login').post(userValidation.login, userController.login)

Router.route('/logout').delete(userController.logout)

Router.route('/refresh_token').get(userController.refreshToken)

// Get current user's info
Router.route('/me').get(authMiddleware.isAuthorized, userController.getMe)

/** Favorites APIs */
Router.route('/favorites')
  .get(authMiddleware.isAuthorized, userController.getFavorites)
  .post(
    authMiddleware.isAuthorized,
    userValidation.addFavorite,
    userController.addFavorite
  )

Router.route('/favorites/:listingId').delete(
  authMiddleware.isAuthorized,
  userValidation.removeFavorite,
  userController.removeFavorite
)

Router.route('/update').put(
  authMiddleware.isAuthorized,
  multerUploadMiddlewares.upload.single('avatar'),
  userValidation.update,
  userController.update
)

/** Admin APIs */
Router.route('/all').get(
  authMiddleware.isAuthorized, // authMiddleware.isAdmin,
  userController.getAllUsers
)

Router.route('/').post(
  authMiddleware.isAuthorized, // authMiddleware.isAdmin,
  userValidation.createNew,
  userController.createUserByAdmin
)

Router.route('/:id')
  .get(
    authMiddleware.isAuthorized, // authMiddleware.isAdmin,
    userController.getUserDetails
  )
  .put(
    authMiddleware.isAuthorized, // authMiddleware.isAdmin,
    userValidation.update, // You might need a specific validation for admin updates
    userController.updateUserByAdmin
  )
  .delete(
    authMiddleware.isAuthorized, // authMiddleware.isAdmin,
    userController.deleteUserByAdmin
  )

export const userRoute = Router
