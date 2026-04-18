import jwt from 'jsonwebtoken'

interface TokenData {
  id: number
  role: string
  name:String
  phone:String
  image:string | null
  tokenVersion: number
}

export const createToken = (data: TokenData): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined')
  }

  return jwt.sign(data, secret, {
    expiresIn: '7d',
  })
}
