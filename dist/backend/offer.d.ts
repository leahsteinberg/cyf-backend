import { type Offer } from '../types.js';
export { createOffer, setOfferExpired } from './update/offer-update.js';
export { getOffersForUser, getOfferById, getMeetingOffers } from './query/offer-lookup.js';
export declare const acceptOffer: ({ userId, offerId }: {
    userId: string;
    offerId: string;
}) => Promise<Offer>;
export declare const rejectOffer: ({ offerId }: {
    offerId: string;
}) => Promise<Offer>;
export declare const findFriendIdToOffer: ({ offers, meetingId, allFriendIds }: {
    offers: Offer[];
    meetingId: string;
    allFriendIds: string[];
}) => Promise<{
    friendToOfferId: string | undefined;
    unOfferedCount: number;
}>;
export declare const findRecentOffer: (offers: Offer[]) => {
    recentOffer: Offer | undefined;
    olderOffers: Offer[];
};
export declare const getIsOfferExpired: ({ offer }: {
    offer: Offer;
}) => Promise<Boolean>;
export declare const setOffersExpired: (offers: Offer[]) => Promise<Offer[]>;
//# sourceMappingURL=offer.d.ts.map