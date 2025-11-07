import { createInvite, findInvite, getSentInvites } from "../backend/invite.js";
import { findUserByPhone, createUser } from "../backend/user.js";
import { createFriendship } from "../backend/friendship.js";
export const handleCreateInvite = async (req, res) => {
    const { userFromId, userToPhoneNumber } = req.body;
    console.log("create invite - got - ", { userFromId, userToPhoneNumber });
    const invitation = await createInvite({ userFromId, userToPhoneNumber });
    res.send(invitation); // TODO - switch to res.json()?
};
export const handleInviteSignUp = async (req, res) => {
    const { token, email, phoneNumber, name, password } = req.body;
    console.log("/api/sign-up-accept-invite", { token, email, phoneNumber, name, password });
    const userTo = await findUserByPhone(phoneNumber);
    if (!userTo) {
        const invite = await findInvite(token, phoneNumber);
        if (invite && invite.userToPhoneNumber === phoneNumber) {
            const { userFromId } = invite;
            const newUser = await createUser({ email, phoneNumber, name, password });
            const newFriendship = await createFriendship({ userId1: userFromId, userId2: newUser.user.id });
            res.json(newUser);
        }
    }
};
export const handleGetSentInvites = async (req, res) => {
    const { id } = req.body;
    const sentInvites = await getSentInvites({ userFromId: id });
    res.json(sentInvites); // TODO - switch to res.json()?
};
//# sourceMappingURL=invite-handler.js.map