/* eslint-disable no-useless-catch */
import { userModel } from '~/models/userModel'
import { listingModel } from '~/models/listingModel'
import { GET_DB } from '~/config/mongodb'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { ENV } from '~/config/environment'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { cloudinaryProvider } from '~/providers/cloudinaryProvider'
import crypto from 'crypto'

const createNew = async (reqBody) => {
  try {
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(reqBody.password, salt)
    const verifyToken = crypto.randomBytes(32).toString('hex')

    const newUser = {
      ...reqBody,
      password: hashedPassword,
      verifyToken,
      isActive: true
    }

    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Don't return password
    delete getNewUser.password
    return getNewUser
  } catch (error) {
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    const { email, token } = reqBody
    const user = await userModel.findOneByEmail(email)

    if (!user || user.verifyToken !== token) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid verification token.'
      )
    }

    // Nếu token hợp lệ, kích hoạt tài khoản và xóa token
    const updatedUser = await userModel.update(user._id, {
      isActive: true,
      verifyToken: null
    })

    return updatedUser
  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    const { email, password } = reqBody
    const user = await userModel.findOneByEmail(email)

    if (!user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Tài khoản hoặc mật khẩu không đúng.'
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Tài khoản hoặc mật khẩu không đúng.'
      )
    }

    if (!user.isActive) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Tài khoản chưa verify, hãy verify trước khi đăng nhập.'
      )
    }

    // Create Access Token
    const accessToken = await JwtProvider.generationToken(
      { _id: user._id.toString(), email: user.email, role: user.role },
      ENV.ACCESS_TOKEN_SECRET_SIGNATURE,
      ENV.ACCESS_TOKEN_LIFE
    )

    // Có thể sử dụng phương pháp tạo Schema Sesstion để lưu refreshToken tăng bảo mật Như video https://www.youtube.com/watch?v=33BUj_fLNgk&t=2s
    // Create Refresh Token
    const refreshToken = await JwtProvider.generationToken(
      { _id: user._id.toString(), email: user.email, role: user.role },
      ENV.REFRESH_TOKEN_SECRET_SIGNATURE,
      ENV.REFRESH_TOKEN_LIFE
    )

    await userModel.update(user._id, { refreshToken })

    // Don't return sensitive info
    delete user.password
    delete user.refreshToken

    return { user, accessToken, refreshToken }
  } catch (error) {
    throw error
  }
}

const refreshToken = async (token) => {
  try {
    if (!token) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token không tìm thấy.'
      )
    }
    const decoded = await JwtProvider.verifyToken(
      token,
      ENV.REFRESH_TOKEN_SECRET_SIGNATURE
    )
    const user = await userModel.findOneById(decoded._id)
    if (!user || user.refreshToken !== token) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token không hợp lệ.'
      )
    }

    const newAccessToken = await JwtProvider.generationToken(
      { _id: user._id.toString(), email: user.email, role: user.role },
      ENV.ACCESS_TOKEN_SECRET_SIGNATURE,
      ENV.ACCESS_TOKEN_LIFE
    )
    return { accessToken: newAccessToken }
  } catch (error) {
    throw error
  }
}

const update = async (userId, updateData, userAvatarFile) => {
  try {
    if (userAvatarFile) {
      const uploadResult = await cloudinaryProvider.streamUpload(
        userAvatarFile.buffer,
        'remarket/avatars'
      )
      updateData.avatar = uploadResult.secure_url
    }

    const updatedUser = await userModel.update(userId, updateData)
    delete updatedUser.password
    return updatedUser
  } catch (error) {
    throw error
  }
}

const getDetails = async (userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
    }
    // Don't return sensitive info
    delete user.password
    delete user.refreshToken
    delete user.verifyToken
    return user
  } catch (error) {
    throw error
  }
}

const addFavorite = async (userId, listingId) => {
  try {
    const listing = await listingModel.findOneById(listingId)
    if (!listing || listing._destroy) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Listing not found.')
    }

    await GET_DB()
      .collection(userModel.USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $addToSet: { favorites: new ObjectId(listingId) } }
      )
    return { message: 'Listing added to favorites.' }
  } catch (error) {
    throw error
  }
}

const removeFavorite = async (userId, listingId) => {
  try {
    await GET_DB()
      .collection(userModel.USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { favorites: new ObjectId(listingId) } }
      )
    return { message: 'Listing removed from favorites.' }
  } catch (error) {
    throw error
  }
}

const getFavorites = async (userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
    }

    const favorites = await GET_DB()
      .collection(userModel.USER_COLLECTION_NAME)
      .aggregate([
        { $match: { _id: new ObjectId(userId) } },
        {
          $lookup: {
            from: listingModel.LISTING_COLLECTION_NAME,
            localField: 'favorites',
            foreignField: '_id',
            as: 'favoriteListings'
          }
        },
        {
          $project: {
            _id: 0,
            favoriteListings: 1
          }
        }
      ])
      .toArray()

    return favorites[0] ? favorites[0].favoriteListings : []
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update,
  getDetails,
  addFavorite,
  removeFavorite,
  getFavorites,
  // Functions for admin
  getAllUsers: userModel.find,
  countUsers: userModel.countDocuments,
  deleteUser: userModel.deleteOneById
}
