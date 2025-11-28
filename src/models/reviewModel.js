import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

const REVIEW_COLLECTION_NAME = 'reviews'
const REVIEW_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required(),
  listingId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().strict(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'userId', 'listingId', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await REVIEW_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const dataToInsert = {
      ...validData,
      userId: new ObjectId(validData.userId),
      listingId: new ObjectId(validData.listingId)
    }
    return await GET_DB()
      .collection(REVIEW_COLLECTION_NAME)
      .insertOne(dataToInsert)
  } catch (error) {
    if (
      error.message.includes(
        'Argument passed in must be a string of 12 bytes or a string of 24 hex characters'
      )
    ) {
      throw new Error('Invalid userId or listingId format.')
    }
    throw new Error(error)
  }
}

const findOneById = async (reviewId) => {
  try {
    return await GET_DB()
      .collection(REVIEW_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(reviewId)
      })
  } catch (error) {
    throw new Error(error)
  }
}

const findByListingId = async (listingId) => {
  try {
    const db = GET_DB()
    const cursor = db.collection(REVIEW_COLLECTION_NAME).find({
      listingId: new ObjectId(listingId),
      _destroy: false
    })
    return await cursor.toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (reviewId, updateData) => {
  try {
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })

    const dataToUpdate = {
      ...updateData,
      updatedAt: Date.now()
    }

    const result = await GET_DB()
      .collection(REVIEW_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(reviewId) },
        { $set: dataToUpdate },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (reviewId) => {
  try {
    const result = await GET_DB()
      .collection(REVIEW_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(reviewId) },
        { $set: { _destroy: true, updatedAt: Date.now() } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const reviewModel = {
  REVIEW_COLLECTION_NAME,
  REVIEW_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findByListingId,
  update,
  deleteOneById
}
