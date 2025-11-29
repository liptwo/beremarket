import { ENV } from '~/config/environment'

// Danh sách các domain được phép gọi API (CORS whitelist)
// Chỉ các origin trong mảng này mới được nhận header `Access-Control-Allow-Origin`
export const WHITELIST_DOMAINS = [
    // Domain FE ở môi trường dev (nếu có)
    ENV.WEBSITE_DOMAIN_DEVELOPMENT,

    // Domain FE ở môi trường production (nếu có cấu hình trong .env)
    ENV.WEBSITE_DOMAIN_PRODUCTION,

    // Domain Vercel hiện tại của bạn
    'https://frontend-theta-ten-83.vercel.app'
].filter(Boolean)

