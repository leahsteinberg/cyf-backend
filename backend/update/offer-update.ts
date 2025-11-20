
import { prisma } from "../auth.js";
import type { Offer } from '../../types.js';
import { OPEN_OFFER_STATE } from "../utils.js";

export const createOffer = async ({meetingId, userOfferedId, expiresAt}
    : {meetingId: string, userOfferedId: string, expiresAt: Date}): Promise<Offer| undefined> => {
    const offer = await prisma.offer.create({
        data: {
            meetingId,
            userOfferedId,
            offerState: OPEN_OFFER_STATE,
            ...(expiresAt && {expiresAt})
        }
    })
    console.log("Meeting ID:" , meetingId, "Made a new offer: ", offer);
    return offer;
};

export const setOfferExpired = async ({ offerId }: { offerId: string }): Promise<Offer> => {
    const expiredOffer = prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: 'EXPIRED',
        }

    })
    return expiredOffer;

};

export const setOfferAccepted = async ({ offerId }: { offerId: string }): Promise<Offer> => {
    const acceptedOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: 'ACCEPTED',
        }

    })
    return acceptedOffer;
};

export const setOfferRejected = async ({ offerId }: { offerId: string }): Promise<Offer> => {
    const rejectedOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: 'REJECTED',
        }
    })
    return rejectedOffer;
};
