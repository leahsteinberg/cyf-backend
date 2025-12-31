import { isBroadcastMeeting } from '../types.js';
import { getMeetingOffers } from './offer.js';
import { getMeetingById } from './query/meeting-lookup.js';
import { getAcceptedOfferByMeetingId, getOffersForUser } from './query/offer-lookup.js';
import { deleteMeetingAndOffers, setMeetingOpen } from './update/meeting-update.js';
import { setOfferOpen } from './update/offer-update.js';
export const findBroadcastedMeetings = (meetings) => {
    return meetings.filter(meeting => isBroadcastMeeting(meeting));
};
export const deleteBroadcastedMeeting = async (meeting) => {
    await deleteMeetingAndOffers({ meetingId: meeting.id });
    // const offers = await getMeetingOffers({meetingId: meeting.id})
    // deleteMeeting
    // await setOffersExpired(offers)
};
export const unacceptMeetingByAcceptor = async ({ meetingId }) => {
    const offer = await getAcceptedOfferByMeetingId({ meetingId });
    if (!offer) {
        throw new Error("No valid offer for user found.");
    }
    const reOpenedOffer = await setOfferOpen({ offerId: offer.id });
    const offers = await getMeetingOffers({ meetingId });
    const otherOffers = offers.filter(o => o.id != reOpenedOffer.id);
    for (let otherOffer of otherOffers) {
        await setOfferOpen({ offerId: otherOffer.id });
    }
    const openMeeting = await setMeetingOpen({ meetingId });
    return reOpenedOffer;
};
export const getOfferedMeetings = async (userId) => {
    const offers = await getOffersForUser({ userId });
    const meetingIds = offers.map((o) => o.meetingId);
    const meetingsOfferedPromises = meetingIds.map((meetingId) => getMeetingById({ meetingId }));
    const meetings = await Promise.all(meetingsOfferedPromises);
    const filteredMeetings = meetings.filter((m) => !!m);
    if (!filteredMeetings) {
        return [];
    }
    return filteredMeetings;
};
//# sourceMappingURL=meeting.js.map