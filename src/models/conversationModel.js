import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'

const CONVERSATION_COLLECTION_NAME = 'conversations'
const CONVERSATION_COLLECTION_SCHEMA = Joi.object({
  participants: Joi.array().items(Joi.string()).length(2).required(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await CONVERSATION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const dataToInsert = {
      ...validData,
      participants: validData.participants.map(id => new ObjectId(id))
    }
    return await GET_DB()
      .collection(CONVERSATION_COLLECTION_NAME)
      .insertOne(dataToInsert)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (conversationId) => {
  try {
    return await GET_DB()
      .collection(CONVERSATION_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(conversationId)
      })
  } catch (error) {
    throw new Error(error)
  }
}

const findByParticipantId = async (userId) => {
    try {
      return await GET_DB()
        .collection(CONVERSATION_COLLECTION_NAME)
        .find({
          participants: new ObjectId(userId)
        }).toArray()
    } catch (error) {
      throw new Error(error)
    }
}

const findByParticipants = async (participants) => {
  try {
    return await GET_DB()
      .collection(CONVERSATION_COLLECTION_NAME)
      .findOne({
        participants: { $all: participants.map(id => new ObjectId(id)) }
      })
  } catch (error) {
    throw new Error(error)
  }
}

export const conversationModel = {
  CONVERSATION_COLLECTION_NAME,
  CONVERSATION_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findByParticipantId,
  findByParticipants
}
