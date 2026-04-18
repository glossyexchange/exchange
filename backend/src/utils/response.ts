import { Response } from 'express'

export const responseReturn = (
  res: Response,
  code: number,
  data: any
): void => {
  res.status(code).json(data);
};