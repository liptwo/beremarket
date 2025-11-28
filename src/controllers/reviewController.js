import { StatusCodes } from 'http-status-codes'
import { reviewModel } from '~/models/reviewModel'
import { listingModel } from '~/models/listingModel'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { listingId, rating, comment } = req.body

    const listing = await listingModel.findOneById(listingId)
    if (!listing) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Listing not found.')
    }

    const reviewData = {
      userId: userId.toString(),
      listingId,
      rating,
      comment
    }

    const createdReview = await reviewModel.createNew(reviewData)
    res.status(StatusCodes.CREATED).json(createdReview)
  } catch (error) {
    next(error)
  }
}

const getReviewsByListingId = async (req, res, next) => {
  try {
    const { listingId } = req.params
    const reviews = await reviewModel.findByListingId(listingId)
    res.status(StatusCodes.OK).json(reviews)
  } catch (error) {
    next(error)
  }
}

const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const userId = req.jwtDecoded._id.toString()
    const updateData = req.body

    const review = await reviewModel.findOneById(reviewId)

    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found.')
    }

    if (review.userId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to update this review.')
    }

    const updatedReview = await reviewModel.update(reviewId, updateData)
    res.status(StatusCodes.OK).json(updatedReview)
  } catch (error) {
    next(error)
  }
}

const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const userId = req.jwtDecoded._id.toString()

    const review = await reviewModel.findOneById(reviewId)

    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found.')
    }

    if (review.userId.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to delete this review.')
    }

    const result = await reviewModel.deleteOneById(reviewId)
    res.status(StatusCodes.OK).json({ message: 'Review deleted successfully.', result })
  } catch (error) {
    next(error)
  }
}

export const reviewController = {
  createNew,
  getReviewsByListingId,
  updateReview,
  deleteReview
}
