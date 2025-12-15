import type { Meeting, Offer } from "../types.js";
import { getEffectiveTimeType, getEffectiveTargetType, IMMEDIATE_TIME_TYPE, OPEN_TARGET_TYPE } from "../types.js";
import { getFriendIds } from "./friendship.js";
import { makeBroadcastOffer } from "./process-meeting.js";
import { setBroadcastPending, setBroadcastUnclaimed } from "./update/broadcast-update.js";
import { getOfferById } from "./query/offer-lookup.js";
import { getMeetingById } from "./query/meeting-lookup.js";

type ValidationResult =
    | { valid: true; offer: Offer; meeting: Meeting }
    | { valid: false; error: string; statusCode: number };

export const validateBroadcastRequest = async (
    {userId, offerId}: {userId: string, offerId: string}
): Promise<ValidationResult> => {
    // Validate userId and offerId are provided
    if (!userId || !offerId) {
        return {
            valid: false,
            error: "userId and offerId are required",
            statusCode: 400
        };
    }

    // Check if offer exists
    const offer = await getOfferById({ offerId });
    if (!offer) {
        return {
            valid: false,
            error: "Offer not found",
            statusCode: 404
        };
    }

    // Check if offer belongs to the user
    if (offer.userOfferedId !== userId) {
        return {
            valid: false,
            error: "Offer does not belong to this user",
            statusCode: 403
        };
    }

    // Check if meeting exists
    const meeting = await getMeetingById({ meetingId: offer.meetingId });
    if (!meeting) {
        return {
            valid: false,
            error: "Meeting not found",
            statusCode: 404
        };
    }

    // Check if meeting is BROADCAST type (IMMEDIATE + OPEN)
    const timeType = getEffectiveTimeType(meeting);
    const targetType = getEffectiveTargetType(meeting);
    const isBroadcast = timeType === IMMEDIATE_TIME_TYPE && targetType === OPEN_TARGET_TYPE;

    if (!isBroadcast) {
        return {
            valid: false,
            error: "This operation is only valid for broadcast meetings",
            statusCode: 400
        };
    }

    // Check if meeting has broadcast metadata
    if (!meeting.broadcastMetadata) {
        return {
            valid: false,
            error: "Broadcast meeting is missing metadata",
            statusCode: 500
        };
    }

    return {
        valid: true,
        offer,
        meeting
    };
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


// CLAIMED
export const tryAcceptClaimedBroadcast = async ({meeting}: {meeting: Meeting}) => {
    // return an error - later on, maybe return somethign that's like "come back in 5 mins"
}

export const cancelClaimedBroadcast = async ({meeting}: {meeting: Meeting}) => {}