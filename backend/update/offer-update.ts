
import { prisma } from "../auth.js";
import type { Offer } from '../../types.js';
import {
    OPEN_OFFER_STATE,
    ACCEPTED_OFFER_STATE,
    REJECTED_OFFER_STATE,
    EXPIRED_OFFER_STATE
} from '../../types.js';


export const createOffer = async ({meetingId, userOfferedId, expiresAt }
    : {meetingId: string, userOfferedId: string, expiresAt: Date }): Promise<Offer| undefined> => {
    const offer = await prisma.offer.create({
        data: {
            meetingId,
            userOfferedId,
            offerState: OPEN_OFFER_STATE,
            expiresAt,
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
            offerState: EXPIRED_OFFER_STATE,
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
            offerState: ACCEPTED_OFFER_STATE,
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
            offerState: OPEN_OFFER_STATE,
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
            offerState: REJECTED_OFFER_STATE,
        }
    })
    return rejectedOffer;
};
