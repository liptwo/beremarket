import express from 'express'
import { reviewController } from '~/controllers/reviewController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { reviewValidation } from '~/validations/reviewValidation'

const Router = express.Router()

// Public route to get reviews for a listing
Router.route('/listing/:listingId').get(reviewController.getReviewsByListingId)

// All routes below this will be protected by the auth middleware
Router.use(authMiddleware.isAuthorized)

Router.route('/').post(reviewValidation.createNew, reviewController.createNew)

Router.route('/:reviewId')
  .put(reviewController.updateReview)
  .delete(reviewController.deleteReview)

export const reviewRoute = Router
