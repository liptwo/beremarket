import { StatusCodes } from 'http-status-codes'
import multer from 'multer'
import ApiError from '~/utils/ApiError'
import {
  ALLOW_COMMON_FILE_TYPES,
  LIMIT_COMMON_FILE_SIZE
} from '~/utils/validators'

// doc
// https://www.npmjs.com/package/multer/v/1.4.5-lts.1?activeTab=readme

// kiểm tra lại loại file

const customFileFilter = (req, file, callback) => {
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted
  // console.log('file', file)

  // multer sử dụng mimetype thay vì type
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.mimetype)) {
    const errorMessage = 'File type is invalid. Only accept jpg, jpeg and png'
    return callback(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage),
      null
    )
  }
  // file hợp lệ
  return callback(null, true)
}

//Tạo function upload file
const upload = multer({
  limits: { fileSize: LIMIT_COMMON_FILE_SIZE },
  fileFilter: customFileFilter
})

export const multerUploadMiddlewares = {
  upload
}
