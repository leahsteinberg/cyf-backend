import type { Meeting } from "../types.js";
import { getFriendIds } from "./friendship.js";
import { makeBroadcastOffer } from "./process-meeting.js";
import { setBroadcastSubState } from "./update/meeting-update.js";

export const processNewBroadcastMeeting = async ({meeting}: {meeting: Meeting}): Promise<Meeting> => {
    // Validate meeting exists and has required fields
    if (!meeting || !meeting.id || !meeting.userFromId) {
        throw new Error("Invalid meeting: missing required fields");
    }

    const userFrom = meeting.userFromId;

    const allFriendIds = await getFriendIds(userFrom);
    console.log("broadcast meeting - allfriendIds, ", allFriendIds)
    for (let friendId of allFriendIds) {
        await makeBroadcastOffer({meeting, userOfferedId: friendId})
    }

    return meeting;
};

export const tryAcceptUnclaimedBroadcast = async ({meeting}: {meeting: Meeting}) => {
    await setBroadcastSubState({meetingId: meeting.id, subState: 'PENDING_CLAIMED'});
}
