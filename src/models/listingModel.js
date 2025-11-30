import Joi from 'joi'
import { eq } from 'lodash'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

// Define constants for status and condition to ensure consistency
const LISTING_CONDITION = {
  NEW: 'new',
  LIKE_NEW: 'like_new',
  USED: 'used'
}

const LISTING_STATUS = {
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  EXPIRED: 'EXPIRED',
  DELETED: 'DELETED'
}

const LISTING_COLLECTION_NAME = 'listings'
const LISTING_COLLECTION_SCHEMA = Joi.object({
  // sellerId will be validated as a string, but should be an ObjectId.
  // We will convert it to ObjectId before database operations.
  sellerId: Joi.string().required(),
  title: Joi.string().required().min(5).max(100).strict(),
  description: Joi.string().required().min(10).max(5000),
  price: Joi.number().required().min(0),
  categoryId: Joi.string().required().trim().strict(),
  condition: Joi.string()
    .valid(...Object.values(LISTING_CONDITION))
    .required(),
  images: Joi.array().items(Joi.string().uri()).default([]),
  location: Joi.string().trim().strict().default(null),
  status: Joi.string()
    .valid(...Object.values(LISTING_STATUS))
    .default(LISTING_STATUS.PENDING),
  expried_at: Joi.date().timestamp('javascript').default(null),
  views: Joi.number().default(0),
  viewedBy: Joi.array().items(Joi.string()).default([]),
  isFeatured: Joi.boolean().default(false),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'sellerId', 'createdAt']

const validateBeforeCreate = async (data) => {
  // We need to ensure sellerId is a valid ObjectId string, but Joi doesn't have a built-in rule for it without custom extensions.
  // The conversion to ObjectId will happen in the createNew function.
  return await LISTING_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const dataToInsert = {
      ...validData,
      sellerId: new ObjectId(validData.sellerId) // Convert string to ObjectId
    }
    return await GET_DB()
      .collection(LISTING_COLLECTION_NAME)
      .insertOne(dataToInsert)
  } catch (error) {
    // Catching potential ObjectId creation errors if the string is invalid
    if (
      error.message.includes(
        'Argument passed in must be a string of 12 bytes or a string of 24 hex characters'
      )
    ) {
      throw new Error('Invalid sellerId format.')
    }
    throw new Error(error)
  }
}

const findOneById = async (listingId) => {
  try {
    const db = GET_DB()
    const listing = await db.collection(LISTING_COLLECTION_NAME).findOne({
      _id: new ObjectId(listingId)
    })
    return listing
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByIdAndUpdateView = async (listingId, userId) => {
  try {
    const db = GET_DB()
    // Sử dụng findOneAndUpdate để đảm bảo tính nguyên tử
    // Tăng `views` và thêm `userId` vào `viewedBy` chỉ khi userId chưa tồn tại trong mảng
    const result = await db
      .collection(LISTING_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(listingId),
          sellerId: { $ne: new ObjectId(userId) }, // Người bán không tự tăng view của mình
          viewedBy: { $ne: userId } // Chỉ cập nhật nếu user này chưa xem
        },
        {
          $inc: { views: 1 },
          $addToSet: { viewedBy: userId } // $addToSet đảm bảo không có userId trùng lặp
        },
        { returnDocument: 'after' } // Trả về document sau khi đã cập nhật
      )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

// A function to find all listings, with optional filters
const find = async (filter = {}, options = {}) => {
  try {
    const db = GET_DB()
    let cursor = db.collection(LISTING_COLLECTION_NAME).find(filter)

    // Apply options like sort, skip, limit
    if (options.sort) {
      cursor = cursor.sort(options.sort)
    }
    if (options.skip) {
      cursor = cursor.skip(options.skip)
    }
    if (options.limit) {
      cursor = cursor.limit(options.limit)
    }

    return await cursor.toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (listingId, updateData) => {
  try {
    Object.keys(updateData).forEach((fieldName) => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })

    if (updateData.price) updateData.price = Number(updateData.price)

    const dataToUpdate = {
      ...updateData,
      updatedAt: Date.now()
    }

    const result = await GET_DB()
      .collection(LISTING_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(listingId) },
        { $set: dataToUpdate },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Using soft delete by setting _destroy to true
const deleteOneById = async (listingId) => {
  try {
    const result = await GET_DB()
      .collection(LISTING_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(listingId) },
        { $set: { _destroy: true, updatedAt: Date.now() } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const aggregate = async (pipeline = []) => {
  try {
    return await GET_DB()
      .collection(LISTING_COLLECTION_NAME)
      .aggregate(pipeline)
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const countDocuments = async (filter = {}) => {
  try {
    return await GET_DB()
      .collection(LISTING_COLLECTION_NAME)
      .countDocuments(filter)
  } catch (error) {
    throw new Error(error)
  }
}

export const listingModel = {
  LISTING_COLLECTION_NAME,
  LISTING_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByIdAndUpdateView,
  find,
  aggregate,
  update,
  deleteOneById,
  countDocuments
}
