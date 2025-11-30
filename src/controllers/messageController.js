import { StatusCodes } from 'http-status-codes'
import { conversationModel } from '~/models/conversationModel'
import { messageModel } from '~/models/messageModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { getIO } from '~/sockets/messageSocket'

const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.jwtDecoded._id
    const { receiverId, message, imageUrl, location } = req.body

    // Kiểm tra xem có receiverId và ít nhất một trong các nội dung tin nhắn không
    if (!receiverId || (!message && !imageUrl && !location)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'ReceiverId and message, imageUrl, or location are required.'
      )
    }

    const receiver = await userModel.findOneById(receiverId)
    if (!receiver) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Receiver not found.')
    }

    // Tìm hoặc tạo conversation
    let conversation = await conversationModel.findByParticipants([
      senderId,
      receiverId
    ])

    if (!conversation) {
      const newConversation = await conversationModel.createNew({
        participants: [senderId, receiverId]
      })

      conversation = {
        _id: newConversation.insertedId,
        participants: [senderId, receiverId]
      }
    }

    // Tạo message mới
    const newMessageData = {
      conversationId: conversation._id.toString(),
      senderId: senderId.toString(),
      receiverId: receiverId.toString(),
      message
    }
    // Thêm imageUrl vào dữ liệu tin nhắn mới
    if (imageUrl) newMessageData.imageUrl = imageUrl
    // Thêm location vào dữ liệu tin nhắn mới
    if (location) {
      newMessageData.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude] // GeoJSON format: [longitude, latitude]
      }
    }

    const createResult = await messageModel.createNew(newMessageData)

    // Lấy message đầy đủ để emit
    const newMessage = await messageModel.findOneById(createResult.insertedId)

    const io = getIO()

    // Emit cho người nhận
    io.to(receiverId.toString()).emit('newMessage', newMessage)

    // Emit cho người gửi (các tab/device khác)
    // io.to(senderId.toString()).emit('newMessage', newMessage)

    res.status(StatusCodes.CREATED).json(newMessage)
  } catch (error) {
    next(error)
  }
}

const getMessages = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { otherUserId } = req.params

    const otherUser = await userModel.findOneById(otherUserId)
    if (!otherUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Other user not found.')
    }

    const conversation = await conversationModel.findByParticipants([
      userId,
      otherUserId
    ])

    if (!conversation) {
      return res.status(StatusCodes.OK).json([])
    }

    const messages = await messageModel.findByConversationId(conversation._id)
    res.status(StatusCodes.OK).json(messages)
  } catch (error) {
    next(error)
  }
}

const getConversations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const conversations = await conversationModel.findByParticipantId(userId)
    res.status(StatusCodes.OK).json(conversations)
  } catch (error) {
    next(error)
  }
}

const findOrCreateConversation = async (req, res, next) => {
  try {
    const senderId = req.jwtDecoded._id
    const { receiverId } = req.body

    if (!receiverId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'ReceiverId is required.')
    }

    const receiver = await userModel.findOneById(receiverId)
    if (!receiver) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Receiver not found.')
    }

    let conversation = await conversationModel.findByParticipants([
      senderId,
      receiverId
    ])

    if (!conversation) {
      const newConversation = await conversationModel.createNew({
        participants: [senderId, receiverId]
      })
      conversation = await conversationModel.findOneById(
        newConversation.insertedId
      )
    }

    res.status(StatusCodes.OK).json(conversation)
  } catch (error) {
    next(error)
  }
}

export const messageController = {
  sendMessage,
  getMessages,
  getConversations,
  findOrCreateConversation
}
