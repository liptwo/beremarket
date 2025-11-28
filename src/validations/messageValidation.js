import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const sendMessage = async (req, res, next) => {
  const correctCondition = Joi.object({
    receiverId: Joi.string().required(),
    message: Joi.string().required().max(2000)
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
