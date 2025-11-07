import { getFriends } from "../backend/friendship.ts";
import { getSentInvites } from "../backend/invite.ts";
export const handleGetFriends = async (req, res) => {
    const { id } = req.body;
    const friends = await getFriends(id);
    const sentInvites = await getSentInvites(id);
    //console.log("invites out", sentInvites)
    res.json(friends); // TODO - switch to res.json()?
};
//# sourceMappingURL=friend-handler.js.map