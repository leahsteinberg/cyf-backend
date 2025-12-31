import type { Offer } from '../../types.js';
export declare const getOffersForUser: ({ userId }: {
    userId: string;
}) => Promise<Offer[]>;
export declare const getOfferById: ({ offerId }: {
    offerId: string;
}) => Promise<Offer | null>;
export declare const getMeetingOffers: ({ meetingId }: {
    meetingId: string;
}) => Promise<Offer[]>;
export declare const getAcceptedOfferByMeetingId: ({ meetingId }: {
    meetingId: string;
}) => Promise<Offer | null>;
//# sourceMappingURL=offer-lookup.d.ts.map