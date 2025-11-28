import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import { userModel } from '~/models/userModel'
import { userService } from '~/services/userService'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    console.log(req.body)
    const { username, email, password } = req.body

    const user = await userModel.findOneByEmail(req.body.email)
    console.log(user)
    if (user) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email đã tồn tại.')
    }
    const displayName = username
    const result = await userService.createNew({
      username,
      email,
      password,
      displayName
    })
    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}
// Chưa cần sử dụng vì đang ở chế độ dev
const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    // In a stateless JWT architecture, logout is handled client-side.
    // Server-side, we just clear the cookies.
    const token = req.cookies?.refreshToken
    if (token) {
      res.clearCookie('accessToken')
      res.clearCookie('refreshToken')
    }

    res.status(StatusCodes.OK).json({ message: 'Đăng xuất thành công.' })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token không hợp lệ hoặc đã hết hạn.'
      )
    )
  }
}

const update = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const userAvatarFile = req.file

    const result = await userService.update(userId, req.body, userAvatarFile)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const getMe = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const user = await userService.getDetails(userId)
    res.status(StatusCodes.OK).json(user)
  } catch (error) {
    next(error)
  }
}

const addFavorite = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { listingId } = req.body
    if (!listingId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Listing ID is required.')
    }
    const result = await userService.addFavorite(userId, listingId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { listingId } = req.params
    const result = await userService.removeFavorite(userId, listingId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const getFavorites = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await userService.getFavorites(userId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  logout,
  refreshToken,
  update,
  getMe,
  addFavorite,
  removeFavorite,
  getFavorites
}
