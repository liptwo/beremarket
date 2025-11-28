import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

// Sửa lại tên collection cho đúng chuẩn convention
const SESSION_COLLECTION_NAME = 'Session'
const SESSION_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required(),
  refreshToken: Joi.string().required(),
  expiresAt: Joi.date().timestamp('javascript').required(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await SESSION_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const dataToInsert = {
      ...validData,
      userId: new ObjectId(validData.userId)
    }
    return await GET_DB()
      .collection(SESSION_COLLECTION_NAME)
      .insertOne(dataToInsert)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByRefreshToken = async (token) => {
  try {
    return await GET_DB()
      .collection(SESSION_COLLECTION_NAME)
      .findOne({ refreshToken: token })
  } catch (error) {
    throw new Error(error)
  }
}

const createIndexes = async () => {
  const db = GET_DB()
  try {
    // TTL index to automatically delete sessions when they expire
    await db
      .collection(SESSION_COLLECTION_NAME)
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    // Index on userId for faster lookups
    await db.collection(SESSION_COLLECTION_NAME).createIndex({ userId: 1 })
    // Unique index on refreshToken to ensure no duplicates
    await db
      .collection(SESSION_COLLECTION_NAME)
      .createIndex({ refreshToken: 1 }, { unique: true })
  } catch (error) {
    // console.error('Error creating indexes for Sessions collection:', error)
    throw new Error(error)
  }
}

export const sessionModel = {
  SESSION_COLLECTION_NAME,
  SESSION_COLLECTION_SCHEMA,
  createNew,
  findOneByRefreshToken,
  createIndexes
}

// You should call sessionModel.createIndexes() once when your application starts
// to ensure the indexes are created. For example, in your main server file after connecting to the database.
