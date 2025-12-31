import type { Offer } from '../../types.js';
export declare const createOffer: ({ meetingId, userOfferedId, expiresAt }: {
    meetingId: string;
    userOfferedId: string;
    expiresAt: Date;
}) => Promise<Offer | undefined>;
export declare const setOfferExpired: ({ offerId }: {
    offerId: string;
}) => Promise<Offer>;
export declare const setOfferAccepted: ({ offerId }: {
    offerId: string;
}) => Promise<Offer>;
export declare const setOfferOpen: ({ offerId }: {
    offerId: string;
}) => Promise<Offer>;
export declare const setOfferRejected: ({ offerId }: {
    offerId: string;
}) => Promise<Offer>;
//# sourceMappingURL=offer-update.d.ts.map