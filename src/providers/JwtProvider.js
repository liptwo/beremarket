// https://www.npmjs.com/package/jsonwebtoken

import JWT from 'jsonwebtoken'

// Function tạo mới một token - Cần 3 tham số đầu vào
// userInfo: Những thông tin muôn đính kèm vào token
// secretSignature: Chữ ký bí mật (dạng một chuỗi string ngẫu nhiên) trên docs thì để tên là privateKey tùy
// đều được
// tokenLife: Thời gian sống của token

const generationToken = async (userInfo, secretSignature, tokenLife) => {
  try {
    // hàm sign của jwt thuật toán mặt định là hs256
    return JWT.sign(userInfo, secretSignature, {
      algorithm: 'HS256',
      expiresIn: tokenLife
    })
  } catch (error) {
    throw new Error(error)
  }
}

// fuction kiểm tra một token có hợp lệ hay không
// hợp lệ ở đây lfà token được tạo ra có đúng với cái chữ kí bí mật secretSignature trong dự án hay không
const verifyToken = async (token, secretSignature) => {
  try {
    // Hàm verify của jwt
    return JWT.verify(token, secretSignature)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  generationToken,
  verifyToken
}
