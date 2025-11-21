import type { Meeting } from "../types.js";
import { getFriendIds } from "./friendship.js";
import { createOffer, findFriendIdToOffer, getMeetingOffers } from "./offer.js";
import { makeBroadcastOffer, makeOffer } from "./process-meeting.js";
import { addHour } from "./utils.js";

export const processBroadcastMeeting = async ({meeting}: {meeting: Meeting}) => {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;
    
    const expiresAt = addHour(new Date());
    const offers = await getMeetingOffers({meetingId})
    const allFriendIds = await getFriendIds(userFrom);
    for (let friendId of allFriendIds) {
        const offer = await makeBroadcastOffer({meeting, userOfferedId: friendId})
    }

};

