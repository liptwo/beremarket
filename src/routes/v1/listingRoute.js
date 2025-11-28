import express from 'express'
import { listingController } from '~/controllers/listingController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { listingValidation } from '~/validations/listingValidation'

const Router = express.Router()

// Public routes for searching and viewing listings
Router.route('/all').get(listingController.getAllListingsSimple)
Router.route('/search').get(
  authMiddleware.isAuthorized,
  listingController.getListings
)
Router.route('/').get(
  authMiddleware.isAuthorized,
  listingController.getListings
) // Fallback for old path

// All routes below this will be protected by the auth middleware

Router.route('/me').get(
  authMiddleware.isAuthorized,
  listingController.getMyListings
)
Router.route('/:id').get(listingController.getDetails)
Router.route('/').post(
  authMiddleware.isAuthorized,
  listingValidation.createNew,
  listingController.createNew
)

Router.route('/:id')
  .put(
    authMiddleware.isAuthorized,
    listingValidation.updateListing,
    listingController.updateListing
  )
  .delete(authMiddleware.isAuthorized, listingController.deleteListing)

export const listingRoute = Router
