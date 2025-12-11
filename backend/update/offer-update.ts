
import { prisma } from "../auth.js";
import type { MeetingType, Offer } from '../../types.js';
import { OPEN_OFFER_STATE } from "../utils.js";


export const createOffer = async ({meetingId, userOfferedId, expiresAt, offerType}
    : {meetingId: string, userOfferedId: string, expiresAt: Date, offerType: MeetingType}): Promise<Offer| undefined> => {
    const offer = await prisma.offer.create({
        data: {
            meetingId,
            userOfferedId,
            offerState: OPEN_OFFER_STATE,
            expiresAt,
            offerType
        }
    })
    console.log("Meeting ID:" , meetingId, "Made a new offer: ", offer);
    return offer;
};

export const setOfferExpired = async ({ offerId }: { offerId: string }): Promise<Offer> => {
    const expiredOffer = await prisma.offer.update({
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

export const setOfferOpen = async ({ offerId }: { offerId: string }): Promise<Offer> => {
    const openOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: 'OPEN',
        }

    })
    return openOffer;
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
