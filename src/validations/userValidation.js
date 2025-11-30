import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE
} from '~/utils/validators'

// dù fe có validate dữ liệu rồi nhưng be vẫn phải cần validate
// bắt buộc phải validate
const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),
    password: Joi.string()
      .required()
      .pattern(PASSWORD_RULE)
      .message(PASSWORD_RULE_MESSAGE)
  })

  try {
    await correctCondition.validateAsync(
      req.body,
      { allowUnknown: true },
      { abortEarly: false }
    )
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

const verifyAccount = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),
    token: Joi.string().required()
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

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),
    password: Joi.string()
      .required()
      .pattern(PASSWORD_RULE)
      .message(PASSWORD_RULE_MESSAGE),
    username: Joi.string().required().trim().strict()

    // // Optional fields
    // avatar: Joi.string().allow(null, ''),
    // address: Joi.string().allow(null, ''),
    // phoneNumber: Joi.string().allow(null, ''),
    // birthday: Joi.date().timestamp('javascript').allow(null, ''),
    // gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').allow(null, '')
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
    // Không cho phép cập nhật các trường này qua API update thông thường
    current_password: Joi.string()
      .pattern(PASSWORD_RULE)
      .message(`current_password: ${PASSWORD_RULE_MESSAGE}`),
    new_password: Joi.string()
      .pattern(PASSWORD_RULE)
      .message(`new_password: ${PASSWORD_RULE_MESSAGE}`),

    // Các trường cho phép admin cập nhật (và user tự cập nhật)
    displayName: Joi.string().trim().strict(),
    address: Joi.string().allow(null, ''),
    phoneNumber: Joi.string().allow(null, ''),
    birthday: Joi.date().timestamp('javascript').allow(null, ''),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').allow(null, ''),
    role: Joi.string().valid('client', 'admin').allow(null, '')
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

const addFavorite = async (req, res, next) => {
  const correctCondition = Joi.object({
    listingId: Joi.string().required()
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

const removeFavorite = async (req, res, next) => {
  const correctCondition = Joi.object({
    listingId: Joi.string().required()
  })
  try {
    await correctCondition.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
    )
  }
}

export const userValidation = {
  createNew,
  verifyAccount,
  login,
  update,
  addFavorite,
  removeFavorite
}
