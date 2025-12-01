import { ENV } from '~/config/environment'

export const WHITELIST_DOMAINS = [
  'http://localhost:5017',
  'http://127.0.0.1:3000',
  ENV.WEBSITE_DOMAIN_PRODUCTION,
  'https://frontend-theta-ten-83.vercel.app'
]
