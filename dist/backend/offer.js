import { pickFriendIdToOffer } from './friendship.js';
import { isTimePast } from './utils.js';
import { OPEN_OFFER_STATE, ACCEPTED_MEETING_STATE } from '../types.js';
import { getOfferById, getMeetingOffers } from './query/offer-lookup.js';
import { setOfferAccepted, setOfferExpired, setOfferRejected } from './update/offer-update.js';
import { setMeetingAcceptors, updateMeetingState } from './update/meeting-update.js';
import { getMeetingById, getUserFromMeetingId } from './query/meeting-lookup.js';
// Re-export pure Prisma functions for backward compatibility
export { createOffer, setOfferExpired } from './update/offer-update.js';
export { getOffersForUser, getOfferById, getMeetingOffers } from './query/offer-lookup.js';
export const acceptOffer = async ({ userId, offerId }) => {
    const offer = await getOfferById({ offerId });
    if (!offer) {
        throw new Error("Could not find valid offer");
    }
    const meetingId = offer.meetingId;
    const meeting = await getMeetingById({ meetingId });
    if (!meeting) {
        throw new Error("Could not find meeting for offer");
    }
    // Check if user already accepted (prevent duplicates)
    if (meeting.acceptedUserIds.includes(userId)) {
        throw new Error("User has already accepted this meeting");
    }
    // Check if maxParticipants already reached
    if (meeting.acceptedUserIds.length >= meeting.maxParticipants) {
        throw new Error("Meeting has reached maximum participants");
    }
    // Set offer to ACCEPTED
    const acceptedOffer = await setOfferAccepted({ offerId });
    // Add user to acceptedUserIds array (also updates acceptedUserId for backward compat)
    await setMeetingAcceptors({ meetingId, userId });
    // Refresh meeting to get updated acceptedUserIds
    const updatedMeeting = await getMeetingById({ meetingId });
    console.log("accept offer - updated meeting:", updatedMeeting);
    if (!updatedMeeting) {
        throw new Error("Failed to retrieve updated meeting");
    }
    console.log("these have accepted", updatedMeeting.acceptedUserIds);
    // Check if we should transition to ACCEPTED state
    if (updatedMeeting.acceptedUserIds.length >= updatedMeeting.minParticipants &&
        meeting.meetingState !== ACCEPTED_MEETING_STATE) {
        // Transition to ACCEPTED (first acceptance when min=1)
        await updateMeetingState(meeting, ACCEPTED_MEETING_STATE, null);
    }
    // Check if we've reached maxParticipants - expire remaining offers
    if (updatedMeeting.acceptedUserIds.length >= updatedMeeting.maxParticipants) {
        const offers = await getMeetingOffers({ meetingId });
        const openOffers = offers.filter(o => o.offerState === OPEN_OFFER_STATE);
        await setOffersExpired(openOffers);
    }
    return acceptedOffer;
};
export const rejectOffer = async ({ offerId }) => {
    const offer = await getOfferById({ offerId });
    if (!offer) {
        throw new Error('Offer not found');
    }
    const rejectedOffer = await setOfferRejected({ offerId });
    console.log("rejected offer --- ", rejectedOffer);
    return rejectedOffer;
};
export const findFriendIdToOffer = async ({ offers, meetingId, allFriendIds }) => {
    // TODO - in the future, do this in a more systematic, yet randomized way.
    const userFrom = await getUserFromMeetingId(meetingId);
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }
    const offeredFriendsIds = offers.map((offer) => offer.userOfferedId);
    const friendToOfferId = pickFriendIdToOffer(offeredFriendsIds, allFriendIds);
    const unOfferedCount = allFriendIds.length - offeredFriendsIds.length;
    return { friendToOfferId, unOfferedCount };
};
export const findRecentOffer = (offers) => {
    if (offers.length > 0) {
        const recentOffer = offers.reduce((recent, curr) => {
            if (recent)
                return recent.createdAt.getTime() > curr.createdAt.getTime() ? recent : curr;
            return curr;
        }, offers[0]);
        const olderOffers = recentOffer ? offers.filter(offer => offer.id !== recentOffer.id) : [];
        return { recentOffer, olderOffers };
    }
    return { recentOffer: undefined, olderOffers: [] };
};
export const getIsOfferExpired = async ({ offer }) => {
    return isTimePast({ eventTime: offer.expiresAt });
};
export const setOffersExpired = async (offers) => {
    let expiredOffers = [];
    for (let offer of offers) {
        const expiredOffer = await setOfferExpired({ offerId: offer.id });
    }
    return expiredOffers;
};
//# sourceMappingURL=offer.js.map