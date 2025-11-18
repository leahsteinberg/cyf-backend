import { findUserByPhone } from "../backend/user.js";
import type { Request, Response } from 'express';


export const handleGetUserByPhone = async (req: Request, res: Response) => {
  const {userPhoneNumber} = req.body;
  const user = await findUserByPhone(userPhoneNumber);
  res.send(user);// TODO - switch to res.json()?
};