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
  return await CONVERSATION_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const dataToInsert = {
      ...validData,
      participants: validData.participants.map((id) => new ObjectId(id))
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
    const db = GET_DB()
    const conversations = await db
      .collection(CONVERSATION_COLLECTION_NAME)
      .aggregate([
        // 1. Tìm các cuộc trò chuyện có người dùng hiện tại
        {
          $match: {
            participants: new ObjectId(userId)
          }
        },
        // 2. Join với collection 'users' để lấy thông tin người tham gia
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participantDetails'
          }
        },
        // 3. Tối ưu: Join với collection 'messages' và chỉ lấy tin nhắn cuối cùng
        {
          $lookup: {
            from: 'messages',
            let: { conversationId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$conversationId', '$$conversationId'] }
                }
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 }
            ],
            as: 'lastMessageArr'
          }
        },
        // 4. Thêm các trường mới
        {
          $addFields: {
            // Tìm người tham gia còn lại
            otherParticipant: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$participantDetails',
                    as: 'participant',
                    cond: { $ne: ['$$participant._id', new ObjectId(userId)] }
                  }
                },
                0
              ]
            },
            // Lấy tin nhắn cuối cùng
            lastMessage: { $arrayElemAt: ['$lastMessageArr', 0] }
          }
        },
        // 5. Sắp xếp theo tin nhắn cuối cùng
        { $sort: { 'lastMessage.createdAt': -1 } },
        // 6. Định hình lại output
        {
          $project: {
            participants: 1,
            createdAt: 1,
            updatedAt: 1,
            lastMessage: 1,
            // Chọn lọc và định hình lại trường otherParticipant
            otherParticipant: {
              _id: '$otherParticipant._id',
              displayName: '$otherParticipant.displayName', // Sửa từ displayName thành name
              username: '$otherParticipant.username', // Sửa từ displayName thành name
              avatar: '$otherParticipant.avatar'
            }
          }
        }
      ])
      .toArray()
    return conversations
  } catch (error) {
    throw new Error(error)
  }
}

// Cập nhật hàm này trong file model của bạn
const findByParticipants = async (participants, reqUserId = null) => {
  try {
    const db = GET_DB()
    const queryPipeline = [
      {
        // 1. Tìm cuộc hội thoại có chứa cả 2 participants
        $match: {
          participants: { $all: participants.map((id) => new ObjectId(id)) }
        }
      },
      {
        // 2. Join với bảng users để lấy thông tin
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantDetails'
        }
      },
      {
        // 3. Project để chọn lọc dữ liệu trả về
        $project: {
          participants: 1,
          createdAt: 1,
          updatedAt: 1,
          // Trả về mảng chi tiết user (nhưng chỉ lấy field cần thiết)
          participantDetails: {
            $map: {
              input: '$participantDetails',
              as: 'participant',
              in: {
                _id: '$$participant._id',
                name: '$$participant.name',
                avatar: '$$participant.avatar',
                email: '$$participant.email'
              }
            }
          }
        }
      }
    ]

    // Nếu có truyền reqUserId vào, ta sẽ tính toán luôn field "otherParticipant"
    // Giống như cách bạn làm ở hàm findByParticipantId
    if (reqUserId) {
      queryPipeline.push({
        $addFields: {
          otherParticipant: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$participantDetails',
                  as: 'p',
                  cond: { $ne: ['$$p._id', new ObjectId(reqUserId)] }
                }
              },
              0
            ]
          }
        }
      })
    }

    const [conversation] = await db
      .collection(CONVERSATION_COLLECTION_NAME)
      .aggregate(queryPipeline)
      .toArray()

    return conversation || null
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
