import { ENV } from './environment'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { WHITELIST_DOMAINS } from '~/utils/constants'

// cấu hình cors cho dự án thực tế
export const corsOptions = {
  origin: function (origin, callback) {
    // cho phép gọi api bằng postman trên môi trường dev
    // thông thường gọi postman thì cái origin là undefined
    // if (!origin && ENV.BUILD_MODE === 'dev') {
    // cứ môi trường dev là cho qua
    if (ENV.BUILD_MODE === 'dev') {
      return callback(null, true)
    }

    // kiểm tra xem origin có phải là domain được chấp nhận hay không
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }

    // cuối cùng callback không được chấp nhận thì trả về lỗi
    return callback(
      new ApiError(
        StatusCodes.FORBIDDEN,
        `${origin} not allowed by our CORS Policy.`
      )
    )
  },
  // some legacy browsers ( IE11, various Smarts TV) choke on 204
  optionsSuccessStatus: 200,

  // cors sẽ cho phép nhận cookie từ request  (jwt access token, refesh token, httpOnly Cookíes)
  credentials: true
}
