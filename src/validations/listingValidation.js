import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(100).strict(),
    description: Joi.string().required().min(10).max(5000),
    price: Joi.number().required().min(0),
    condition: Joi.string(),
    categoryId: Joi.string().required(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    location: Joi.string().trim().strict().optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

const updateListing = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().min(5).max(100).trim(),
    description: Joi.string().min(10).max(5000).trim(),
    price: Joi.number().min(0),
    category: Joi.string(),
    condition: Joi.string(),
    images: Joi.array().items(Joi.string().uri()),
    location: Joi.string().trim().strict(),
    status: Joi.string(),
    listingState: Joi.string()
  })

  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true
    })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const listingValidation = {
  createNew,
  updateListing
}
