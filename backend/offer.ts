import { getFriendIds, pickFriendIdToOffer } from './friendship.js';
import { addHour, REJECTED_MEETING_STATE } from './utils.js';
import type { Offer } from '../types.js';
import { getOfferById, getMeetingOffers } from './query/offer-lookup.js';
import { createOffer, setOfferAccepted, setOfferRejected } from './update/offer-update.js';
import { setMeetingAccepted, setMeetingState } from './update/meeting-update.js';
import { getMeetingById, getUserFromMeetingId } from './query/meeting-lookup.js';

// Re-export pure Prisma functions for backward compatibility
export { createOffer, setOfferExpired } from './update/offer-update.js';
export { getOffersForUser, getOfferById, getMeetingOffers } from './query/offer-lookup.js';

export const acceptOffer = async ({ userId, offerId }
    : { userId: string, offerId: string }): Promise<Offer> => {
    const offer = await getOfferById({offerId});
    if (!offer) {
    // TO DO - make sure we address not having the offer (offer === null)
    // Return ERROR
    }
    const meetingId = offer?.meetingId;

    const acceptedOffer = await setOfferAccepted({ offerId });
    console.log("accepted offer --- ", acceptedOffer)
    if (meetingId) {
        const acceptedMeeting = await setMeetingAccepted({ meetingId, userId });
        console.log("accepted meeting - ", acceptedMeeting);
    }
    return acceptedOffer;

};

export const rejectOffer = async ({ offerId }
    : { offerId: string }): Promise<Offer> => {
    const offer = await getOfferById({offerId});
    if (!offer) {
        throw new Error('Offer not found');
    }

    const rejectedOffer = await setOfferRejected({ offerId });
    console.log("rejected offer --- ", rejectedOffer)
    return rejectedOffer;
};

export const processRejectedOffer = async ({ offerId }
    : { offerId: string }): Promise<void> => {
    const rejectedOffer = await getOfferById({offerId});
    if (!rejectedOffer) {
        throw new Error('Rejected offer not found');
    }

    const meetingId = rejectedOffer.meetingId;

    // Get the meeting
    const meeting = await getMeetingById({ meetingId });

    if (!meeting) {
        throw new Error('Meeting not found');
    }

    // Get all offers for this meeting to find friends already offered to
    const allOffers = await getMeetingOffers({meetingId});

    // Get all friend IDs of the meeting creator
    const allFriendIds = await getFriendIds(meeting.userFromId);

    // Find the next friend to offer to
    const newFriendToOfferId = await findFriendIdToOffer({
        offers: allOffers,
        meetingId,
        allFriendIds
    });

    if (!newFriendToOfferId) {
        // No more friends to offer to, set meeting state to REJECTED
        console.log("No more friends to offer to, setting meeting to REJECTED");
        await setMeetingState({
            meetingId,
            meetingState: REJECTED_MEETING_STATE
        });
    } else {
        // Create a new offer for the next friend
        const expiresAt = addHour(new Date());

        console.log("Creating new offer for friend:", newFriendToOfferId);
        await createOffer({
            meetingId,
            userOfferedId: newFriendToOfferId,
            expiresAt
        });
    }
};

export const findFriendIdToOffer = async ({offers, meetingId, allFriendIds}:
    {offers: Offer[], meetingId: string, allFriendIds: string[]}) => {
    // TODO - in the future, do this in a more systematic, yet randomized way.
    const userFrom = await getUserFromMeetingId(meetingId);
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }
    const offeredFriends = offers.reduce(
        (friendsOffered, offer) => {
            const userOfferedId = offer.userOfferedId.toString()
                return [...friendsOffered, userOfferedId]
            },
        []
    );
    const friendToOfferId = pickFriendIdToOffer(offeredFriends, allFriendIds)
    return friendToOfferId;
}

export const findRecentOffer = (offers: Offer[]) => {
    if (offers.length > 0) {
        const recentOffer = offers.reduce((recent, curr) => {
            return  recent.createdAt.getTime() > curr.createdAt.getTime() ? recent : curr
        }, offers[0])
        return recentOffer
    }
    return null

}

export const determineNeedNewOffer = async ({remainingFriendCount, minutesUntilMeeting}
    : {remainingFriendCount: number, minutesUntilMeeting: number}): Promise<boolean> => {
    if (minutesUntilMeeting <= 60) {
        return false;
    }

    return false;
};
