import { StatusCodes } from 'http-status-codes'
import { ENV } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import ApiError from '~/utils/ApiError'

// middlewares chịu trách nhiệm quan trọng xác thực JWT accesstoken nhận được  từ phía fe có hợp lệ không
const isAuthorized = async (req, res, next) => {
  // Lấy accessToken nằm trong request cookies phía client,- withCredential trong File authrizeAxios
  // console.log(req)
  const clientAccessToken = req.cookies?.accessToken

  // nếu như clientActoken không tồn tại thì trả về lỗi luôn clientAccessToken
  if (!clientAccessToken) {
    next(
      new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED! (token not found)')
    )
    return
  }

  try {
    // Bước 1:Thực hiện giải mã token xem có hợp lệ hay không
    const accessTokenDecoded = await JwtProvider.verifyToken(
      clientAccessToken,
      ENV.ACCESS_TOKEN_SECRET_SIGNATURE
    )
    // console.log(accessTokenDecoded)
    // Bước 2: Quan trọng: nếu như cái token hợp lệ,, thì sẽ cần phải lưu thông tin giải mã được vào cái req.jwtDecoded,
    // để sử dụng cho các tầng cần xử lý ở phía sau
    req.jwtDecoded = accessTokenDecoded
    // Bước 3: Cho phép cái request đi tiếp
    next()
  } catch (error) {
    // console.log('🚀 ~ authMiddlewares.js:27 ~ error:', error)
    // Nếu cái accessToken nó bị hết hạn (expired) thì mình cần trả về một cái mã lỗi GONE_410 cho phía FE biết để gọi api refreshToken
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Cần gọi refresh token.'))
      return
    }
    // Nếu như accessToken không hợp lệ do bất kỳ điều  gì thì khác vụ hết hạn thì chúng ta thẳng try {
    // trả về mã 401 cho phía FE gọi api sign_out luôn
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED! (invalid)'))
  }
}

export const authMiddleware = { isAuthorized }
