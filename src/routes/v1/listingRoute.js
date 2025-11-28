import express from 'express'
import { listingController } from '~/controllers/listingController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { listingValidation } from '~/validations/listingValidation'

const Router = express.Router()

// Public routes, anyone can view listings
Router.route('/').get(listingController.getListings)

Router.route('/:id').get(listingController.getDetails)

// All routes below this will be protected by the auth middleware
Router.use(authMiddleware.isAuthorized)

Router.route('/').post(listingValidation.createNew, listingController.createNew)

Router.route('/:id')
  .put(listingValidation.updateListing, listingController.updateListing)
  .delete(listingController.deleteListing)

export const listingRoute = Router
