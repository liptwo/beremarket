import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const sendMessage = async (req, res, next) => {
  const correctCondition = Joi.object({
    receiverId: Joi.string().required(),
    message: Joi.string().allow('').max(2000),
    imageUrl: Joi.string().uri().optional().allow(null),
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required()
    })
      .optional()
      .allow(null)
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

export const messageValidation = {
  sendMessage
}
