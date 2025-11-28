import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { ENV } from '~/config/environment'

// doc
//https://cloudinary.com/blog/node_js_file_upload_to_a_local_server_or_to_the_cloud

// cấu hình cloudinary, sử dụng v2
const cloudinaryV2 = cloudinary.v2
cloudinaryV2.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET
})

// tạo function để upload lên cloudinary
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    //  tạo luồng stream upload ảnh lên cloudinary
    const stream = cloudinaryV2.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )
    // thực hiện upload trên luồng stream bằng thư viện streamifier
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

export const CloudinaryProvider = { streamUpload }
