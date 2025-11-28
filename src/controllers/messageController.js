import { StatusCodes } from 'http-status-codes'
import { conversationModel } from '~/models/conversationModel'
import { messageModel } from '~/models/messageModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { getIO } from '~/sockets/messageSocket'

const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.jwtDecoded._id
    const { receiverId, message } = req.body

    if (!receiverId || !message) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'ReceiverId and message are required.'
      )
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
      const newConversationResult = await conversationModel.createNew({
        participants: [senderId, receiverId]
      })
      // Tạo object conversation tạm thời để không phải query lại DB
      conversation = {
        _id: newConversationResult.insertedId,
        participants: [senderId, receiverId]
      }
    }

    const newMessageData = {
      conversationId: conversation._id.toString(),
      senderId: senderId.toString(),
      receiverId: receiverId.toString(),
      message
    }
    const createResult = await messageModel.createNew(newMessageData)

    // Lấy lại toàn bộ thông tin tin nhắn vừa tạo
    const newMessage = await messageModel.findOneById(createResult.insertedId)

    // Emit the new message to the receiver
    getIO().to(receiverId.toString()).emit('newMessage', newMessage)
    // Cũng emit cho chính người gửi để cập nhật các client khác của họ (nếu có)
    getIO().to(senderId.toString()).emit('newMessage', newMessage)

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
