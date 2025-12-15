import { pickFriendIdToOffer } from './friendship.js';
import { isTimePast } from './utils.js';
import { OPEN_OFFER_STATE_TYPE, type Offer } from '../types.js';
import { getOfferById, getMeetingOffers } from './query/offer-lookup.js';
import { setOfferAccepted, setOfferExpired, setOfferOpen, setOfferRejected } from './update/offer-update.js';
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
    throw new Error("Could not find valid offer")

    }
    const meetingId = offer?.meetingId;
    const meeting = getMeetingById({ meetingId });
    if (!meeting) {
        throw new Error("Could not find meeting for offer");
    }

    const acceptedOffer = await setOfferAccepted({ offerId });
    const acceptedMeeting = await setMeetingAccepted({ meetingId, userId });
    // const otherOffers = await getMeetingOffers({ meetingId });
    // const expiredOffers = await setOffersExpired(otherOffers);
    const offers = await getMeetingOffers({ meetingId });

    const otherOffers = offers.filter(o => o.id !== offerId);
    console.log("IN HANDLE ACCEPT OFFER __", offer);
    console.log("other offers ----- :))))", otherOffers);
    await setOffersExpired(otherOffers);

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

export const clearOutOffers = async (offers: Offer[]) => {
    for (let offer of offers) {
        if (offer.offerState === OPEN_OFFER_STATE_TYPE) {
            await setOfferExpired({offerId: offer.id})
        }
    }
}
