import { findUserByPhone } from "../backend/query/user-lookup.js";
export const handleGetUserByPhone = async (req, res) => {
    const { userPhoneNumber } = req.body;
    const user = await findUserByPhone(userPhoneNumber);
    res.send(user); // TODO - switch to res.json()?
};
//# sourceMappingURL=user-handler.js.map