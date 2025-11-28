import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'

const CATEGORY_COLLECTION_NAME = 'categories'
const CATEGORY_COLLECTION_SCHEMA = Joi.object({
  name: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  code: Joi.string().optional().max(256).trim().strict(),
  parentId: Joi.string().optional().trim().strict(),
  imageUrl: Joi.string().optional().trim().strict(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const createNew = async (data) => {
  try {
    const validData = await CATEGORY_COLLECTION_SCHEMA.validateAsync(data, {
      abortEarly: false
    })
    return await GET_DB()
      .collection(CATEGORY_COLLECTION_NAME)
      .insertOne(validData)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await GET_DB()
      .collection(CATEGORY_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(id)
      })
  } catch (error) {
    throw new Error(error)
  }
}

const find = async (filter = {}, options = {}) => {
  try {
    const db = GET_DB()
    const cursor = db.collection(CATEGORY_COLLECTION_NAME).find(filter, options)
    return await cursor.toArray()
  } catch (error) {
    throw new Error(error)
  }
}

export const categoryModel = {
  CATEGORY_COLLECTION_NAME,
  CATEGORY_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  find
}
