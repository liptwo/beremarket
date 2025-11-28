import express from 'express'
import { messageController } from '~/controllers/messageController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { messageValidation } from '~/validations/messageValidation'

const Router = express.Router()

// All routes below this will be protected by the auth middleware
Router.use(authMiddleware.isAuthorized)

Router.route('/conversations').get(messageController.getConversations)

Router.route('/find-or-create').post(messageController.findOrCreateConversation)

Router.route('/:otherUserId').get(messageController.getMessages)

Router.route('/').post(
  messageValidation.sendMessage,
  messageController.sendMessage
)

export const messageRoute = Router
