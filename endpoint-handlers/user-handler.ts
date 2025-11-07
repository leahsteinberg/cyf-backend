import { findUserByPhone } from "../backend/user.js";

export const handleGetUserByPhone = async (req, res) => {
  const {userPhoneNumber} = req.body;
  const user = await findUserByPhone(userPhoneNumber);
  res.send(user);// TODO - switch to res.json()?
};