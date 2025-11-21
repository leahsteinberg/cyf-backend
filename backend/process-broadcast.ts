import type { Meeting } from "../types.js";
import { getFriendIds } from "./friendship.js";
import { makeBroadcastOffer } from "./process-meeting.js";

export const processBroadcastMeeting = async ({meeting}: {meeting: Meeting}): Promise<Meeting> => {
    const userFrom = meeting.userFromId;

    const allFriendIds = await getFriendIds(userFrom);
    console.log("broadcast meeting - allfriendIds, ", allFriendIds)
    for (let friendId of allFriendIds) {
        await makeBroadcastOffer({meeting, userOfferedId: friendId})
    }

    return meeting;
};

