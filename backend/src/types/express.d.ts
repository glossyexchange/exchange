import { Request } from 'express';

declare module 'express' {
  interface Request {
    id?: number;
    role?: string;
    tokenVersion?: number;
  }
}