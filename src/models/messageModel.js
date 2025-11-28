import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

const MESSAGE_COLLECTION_NAME = 'messages'
const MESSAGE_COLLECTION_SCHEMA = Joi.object({
  conversationId: Joi.string().required(),
  senderId: Joi.string().required(),
  receiverId: Joi.string().required(),
  message: Joi.string().required().trim().strict(),
  isRead: Joi.boolean().default(false),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await MESSAGE_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const dataToInsert = {
      ...validData,
      conversationId: new ObjectId(validData.conversationId),
      senderId: new ObjectId(validData.senderId),
      receiverId: new ObjectId(validData.receiverId)
    }
    return await GET_DB()
      .collection(MESSAGE_COLLECTION_NAME)
      .insertOne(dataToInsert)
  } catch (error) {
    throw new Error(error)
  }
}

const findByConversationId = async (conversationId) => {
  try {
    const db = GET_DB()
    const cursor = db
      .collection(MESSAGE_COLLECTION_NAME)
      .find({
        conversationId: new ObjectId(conversationId)
      })
      .sort({ createdAt: 1 })
    return await cursor.toArray()
  } catch (error) {
    throw new Error(error)
  }
}

export const messageModel = {
  MESSAGE_COLLECTION_NAME,
  MESSAGE_COLLECTION_SCHEMA,
  createNew,
  findByConversationId
}
