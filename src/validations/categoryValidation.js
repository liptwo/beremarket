import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().required().min(3).max(50).trim().strict(),
    code: Joi.string().optional().max(256).trim().strict().allow(null, ''),
    parentCode: Joi.string().optional().trim().strict().allow(null, ''),
    imageUrl: Joi.string().optional().trim().strict().allow(null, '')
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

const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().min(3).max(50).trim().strict(),
    code: Joi.string().optional().max(256).trim().strict().allow(null, ''),
    parentCode: Joi.string().optional().trim().strict().allow(null, ''),
    imageUrl: Joi.string().optional().trim().strict().allow(null, '')
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

const deleteItem = async (req, res, next) => {
  const correctCondition = Joi.object({
    id: Joi.string().required()
  })
  try {
    await correctCondition.validateAsync(req.params)
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const categoryValidation = {
  createNew,
  update,
  deleteItem
}
