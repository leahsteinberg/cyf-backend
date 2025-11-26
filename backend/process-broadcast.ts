import type { Meeting } from "../types.js";
import { getFriendIds } from "./friendship.js";
import { makeBroadcastOffer } from "./process-meeting.js";
import { setBroadcastPending, setBroadcastUnclaimed } from "./update/broadcast-update.js";


export const validateBroadcastRequest = async () => {
    // TODO - this should be an all-purpose function for catching common errors in requests for 
    // broadcasts, including try-accept-broadcast, accept-broadcast, reject-broadcast.
    // may need a different one for new-broadcast and broadcast-end.
};

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


/// UNCLAIMED
export const tryAcceptUnclaimedBroadcast = async ({meeting, offerId}: {meeting: Meeting, offerId: string}) => {
    return await setBroadcastPending({meetingId: meeting.id, offerClaimedId: offerId});
}

// PENDING
export const tryAcceptPendingBroadcast = async ({meeting, offerId}: {meeting: Meeting, offerId: string}) => {
    // error-state - deal with it later.
    // it's already pending... 
    // is this an error for all users, or everyone BUT the one who has soft-claimed it?
}

export const acceptPendingBroadcast = async ({meeting, offerId}: {meeting: Meeting, offerId: string}) => {
    if (meeting.broadcastMetadata?.offerClaimedId
        && meeting.broadcastMetadata.offerClaimedId === offerId) {
            // TODO - actually accept it
    } else {
        return ""; /// wrong user.
    }}

export const undoPendingBroadcast = async ({meeting}: {meeting: Meeting}) => {
    return await setBroadcastUnclaimed({meetingId: meeting.id})
}


export const cancelPendingBroadcast = async ({meeting, offerId}: {meeting: Meeting, offerId: string}) => {
    if (meeting.broadcastMetadata?.offerClaimedId
        && meeting.broadcastMetadata.offerClaimedId === offerId) {
            return await undoPendingBroadcast({meeting})
    }
    // if you aren't the pending User, then you get an... error??
}


// CLAIMED
export const tryAcceptClaimedBroadcast = async ({meeting}: {meeting: Meeting}) => {
    // return an error - later on, maybe return somethign that's like "come back in 5 mins"
}

export const cancelClaimedBroadcast = async ({meeting}: {meeting: Meeting}) => {}