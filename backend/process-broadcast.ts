import type { Meeting } from "../types.js";
import { getFriendIds } from "./friendship.js";
import { findFriendIdToOffer, getMeetingOffers } from "./offer.js";

export const processBroadcastMeeting = async ({meeting}: {meeting: Meeting}) => {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;
    

    const offers = await getMeetingOffers({meetingId})
    const allFriendIds = await getFriendIds(userFrom);
    

    const {friendToOfferId, unOfferedCount} = await findFriendIdToOffer({offers, meetingId, allFriendIds})
    


};

