import { getEffectiveTimeType, IMMEDIATE_TIME_TYPE, type Offer } from "../types.js";
import { getOfferedMeetings } from "./meeting.js";
import { getOffersForUser } from "./offer.js"
import { getMeetingById } from "./query/meeting-lookup.js";

export const isBroadcastingToUser = async ({possibleBroadcasterId, userId}: {possibleBroadcasterId: string, userId: string}): Promise<boolean> {

    const offeredMeetings = await getOfferedMeetings(userId);
    const possibleBroadcasterMeetings = offeredMeetings.filter((o) => o.userFromId === possibleBroadcasterId);
    const broadcastMeetings = possibleBroadcasterMeetings.filter((o) => getEffectiveTimeType(o) === IMMEDIATE_TIME_TYPE);
    if (broadcastMeetings.length) {
        return true;
    }
    return false;
}


export const isBroadcasting = async (userId: string): Promise<boolean> {

};