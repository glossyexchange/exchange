// import { Request, Response, NextFunction } from 'express'
// import jwt from 'jsonwebtoken'

// // Define the structure of the decoded token
// interface DecodedToken {
//   role: string
//   id: number
//   tokenVersion?: number
// }

// interface AuthenticatedRequest extends Request {
//   role?: string
//   id?: number
//   tokenVersion?: number
// }

// export const authMiddleware = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   const { accessToken } = req.cookies

//   if (!accessToken) {
//     res.status(401).json({ error: 'Please login first' })
//     return
//   }

//   try {
//     if (!process.env.JWT_SECRET) {
//       throw new Error('Environment variable SECRET is not defined')
//     }

//     // Verify the token and decode it
//     const deCodeToken = jwt.verify(
//       accessToken,
//       process.env.JWT_SECRET
//     ) as DecodedToken

//     // Attach the decoded token data to the request object
//     req.role = deCodeToken.role
//     req.id = deCodeToken.id
//     req.tokenVersion = deCodeToken.tokenVersion
//     // Proceed to the next middleware or route handler
//     next()
//   } catch (error) {
//     console.error('Token verification error:', error)
//     res.status(401).json({ error: 'Please login' })
//   }
// }

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  role: string;
  id: number;  // Changed to number
  tokenVersion?: number;
}

export const authMiddleware = async (
  req: Request,  // Use standard Request
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    res.status(401).json({ error: 'Please login first' });
    return;
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const deCodeToken = jwt.verify(
      accessToken,
      process.env.JWT_SECRET
    ) as DecodedToken;

    // Attach to request object
    req.role = deCodeToken.role;
    req.id = deCodeToken.id;  // Now number type
    req.tokenVersion = deCodeToken.tokenVersion;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Please login' });
  }
}
