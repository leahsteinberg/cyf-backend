import { getFriendIds, pickFriendIdToOffer } from './friendship.js';
import { addHour, isTimePast, REJECTED_MEETING_STATE } from './utils.js';
import type { Offer } from '../types.js';
import { getOfferById, getMeetingOffers } from './query/offer-lookup.js';
import { createOffer, setOfferAccepted, setOfferExpired, setOfferOpen, setOfferRejected } from './update/offer-update.js';
import { setMeetingAccepted, setMeetingState } from './update/meeting-update.js';
import { getMeetingById, getUserFromMeetingId } from './query/meeting-lookup.js';
import { NumberInstance } from 'twilio/lib/rest/pricing/v2/number.js';
import { makeOffer, processOffersForMeeting } from './process-meeting.js';

// Re-export pure Prisma functions for backward compatibility
export { createOffer, setOfferExpired } from './update/offer-update.js';
export { getOffersForUser, getOfferById, getMeetingOffers } from './query/offer-lookup.js';

export const acceptOffer = async ({ userId, offerId }
    : { userId: string, offerId: string }): Promise<Offer> => {
    const offer = await getOfferById({offerId});
    if (!offer) {
    // TO DO - make sure we address not having the offer (offer === null)
    // Return ERROR
    throw new Error("Could not find valid offer")

    }
    const meetingId = offer?.meetingId;
    const meeting = getMeetingById({ meetingId });
    if (!meeting) {
        throw new Error("Could not find meeting for offer");
    }

    const acceptedOffer = await setOfferAccepted({ offerId });
    const acceptedMeeting = await setMeetingAccepted({ meetingId, userId });
    const otherOffers = await getMeetingOffers({ meetingId });
    const expiredOffers = await setOffersExpired(otherOffers);
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

export const rejectOfferWithMeeting = async ({offerId}: {offerId: string}) => {
    const offer = await getOfferById({offerId});

    if (!offer) {
        throw new Error("Cannot find offer to reject");
    }

    const meetingId = offer.meetingId;
    const meeting = await getMeetingById({ meetingId });

    if (!meeting) {
        throw new Error("Cannot find meeting for offer")
    }

    const rejectedOffer = await rejectOffer({ offerId });

    if (!rejectedOffer) {
        throw new Error('Error rejecting offer');
    }
    const offers = await getMeetingOffers({ meetingId });
    const otherOffers = offers.filter(o => o.id != rejectedOffer.id);
    for (let otherOffer of otherOffers) {
        await setOfferOpen( {offerId: otherOffer.id});
    }
    //await processOffersForMeeting(meeting)
    console.log("New offer,", rejectedOffer);
    return rejectedOffer;


}


export const findFriendIdToOffer = async ({offers, meetingId, allFriendIds}:
    {offers: Offer[], meetingId: string, allFriendIds: string[]}): Promise<{friendToOfferId: string | undefined, unOfferedCount: number}> => {
    // TODO - in the future, do this in a more systematic, yet randomized way.
    const userFrom = await getUserFromMeetingId(meetingId);
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }

    const offeredFriendsIds = offers.map((offer) => offer.userOfferedId);

    const friendToOfferId = pickFriendIdToOffer(offeredFriendsIds, allFriendIds);
    const unOfferedCount = allFriendIds.length - offeredFriendsIds.length; 
    return {friendToOfferId, unOfferedCount};

}

export const findRecentOffer = (offers: Offer[]):
{recentOffer: Offer | undefined, olderOffers: Offer[]} => {
    if (offers.length > 0) {
        const recentOffer = offers.reduce((recent, curr) => {
            if (recent)  return recent.createdAt.getTime() > curr.createdAt.getTime() ? recent : curr;
            return curr;
        }, offers[0])
        const olderOffers = recentOffer ? offers.filter(offer => offer.id !== recentOffer.id) : [];
        return {recentOffer, olderOffers};

    }
    return {recentOffer: undefined, olderOffers: []}



}

export const determineNeedNewOffer = async ({remainingFriendCount, minutesUntilMeeting}
    : {remainingFriendCount: number, minutesUntilMeeting: number}): Promise<boolean> => {
    if (minutesUntilMeeting <= 60) {
        return false;
    }

    return false;
};


export const getIsOfferExpired = async({offer}: {offer: Offer}): Promise<Boolean> => {
    return isTimePast({eventTime: offer.expiresAt});
}


export const setOffersExpired = async (offers: Offer[]): Promise<Offer[]> => {
    let expiredOffers: Offer[] = [];
    for (let offer of offers) {
        const expiredOffer = await setOfferExpired({offerId: offer.id})
    }
    return expiredOffers
}