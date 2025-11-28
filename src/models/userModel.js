import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'

const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin'
}

const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string()
    .required()
    .pattern(EMAIL_RULE)
    .message(EMAIL_RULE_MESSAGE),
  password: Joi.string().required(),
  // username cắt ra từ email sẽ có khả năng không unique bởi vì sẽ có những tên email trùng nhau nhưng từ
  //các nhà cung cấp khác nhau
  username: Joi.string().required().trim().strict(),
  displayName: Joi.string().required().trim().strict(),
  avatar: Joi.string().default(null),
  role: Joi.string()
    .valid(USER_ROLES.CLIENT, USER_ROLES.ADMIN)
    .default(USER_ROLES.CLIENT),

  favorites: Joi.array().items(Joi.object().instance(ObjectId)).default([]),

  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(),
  phoneNumber: Joi.string().default('0333912532'),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'email', 'username', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    return await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (userId) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(userId)
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByEmail = async (emailValue) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
      email: emailValue
    })
    // console.log('result: ', result)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, updateData) => {
  try {
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })

    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const find = async (filter = {}, options = {}) => {
  try {
    const db = GET_DB()
    const cursor = db.collection(USER_COLLECTION_NAME).find(filter, options)
    return await cursor.toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const countDocuments = async (filter = {}) => {
  try {
    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .countDocuments(filter)
  } catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  USER_ROLES,
  createNew,
  findOneById,
  findOneByEmail,
  update,
  find,
  countDocuments
}
