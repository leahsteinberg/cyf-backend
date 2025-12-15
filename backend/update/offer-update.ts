
import { prisma } from "../auth.js";
import type { Offer } from '../../types.js';
import {
    OPEN_OFFER_STATE_TYPE,
    ACCEPTED_OFFER_STATE_TYPE,
    REJECTED_OFFER_STATE_TYPE,
    EXPIRED_OFFER_STATE_TYPE
} from '../../types.js';


export const createOffer = async ({meetingId, userOfferedId, expiresAt }
    : {meetingId: string, userOfferedId: string, expiresAt: Date }): Promise<Offer| undefined> => {
    const offer = await prisma.offer.create({
        data: {
            meetingId,
            userOfferedId,
            offerState: OPEN_OFFER_STATE_TYPE,
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
            offerState: EXPIRED_OFFER_STATE_TYPE,
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
            offerState: ACCEPTED_OFFER_STATE_TYPE,
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
            offerState: OPEN_OFFER_STATE_TYPE,
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
            offerState: REJECTED_OFFER_STATE_TYPE,
        }
    })
    return rejectedOffer;
};
