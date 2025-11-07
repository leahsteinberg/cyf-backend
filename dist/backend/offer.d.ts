import type { Offer } from '../types.js';
export declare const createOffer: ({ meetingId, userOfferedId }: {
    meetingId: string;
    userOfferedId: string;
}) => Promise<Offer>;
export declare const setOfferExpired: ({ offerId }: {
    offerId: string;
}) => Promise<Offer>;
export declare const acceptOffer: ({ userId, offerId }: {
    userId: string;
    offerId: string;
}) => Promise<Offer>;
export declare const getOffersForUser: ({ userId }: {
    userId: string;
}) => Promise<Offer[]>;
export declare const getOfferById: ({ offerId }: {
    offerId: string;
}) => Promise<Offer | null>;
export declare const findFriendIdToOffer: ({ offers, meetingId, allFriendIds }: {
    offers: Offer[];
    meetingId: string;
    allFriendIds: string[];
}) => Promise<any>;
export declare const findRecentOffer: (offers: Offer[]) => Offer | null | undefined;
export declare const getMeetingOffers: ({ meetingId }: {
    meetingId: string;
}) => Promise<Offer[]>;
export declare const determineNeedNewOffer: ({ remainingFriendCount, minutesUntilMeeting }: {
    remainingFriendCount: number;
    minutesUntilMeeting: number;
}) => Promise<boolean>;
//# sourceMappingURL=offer.d.ts.map