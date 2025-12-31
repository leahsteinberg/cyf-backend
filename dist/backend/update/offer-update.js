import { prisma } from "../auth.js";
import { OPEN_OFFER_STATE, ACCEPTED_OFFER_STATE, REJECTED_OFFER_STATE, EXPIRED_OFFER_STATE } from '../../types.js';
export const createOffer = async ({ meetingId, userOfferedId, expiresAt }) => {
    const offer = await prisma.offer.create({
        data: {
            meetingId,
            userOfferedId,
            offerState: OPEN_OFFER_STATE,
            expiresAt,
        }
    });
    console.log("Meeting ID:", meetingId, "Made a new offer: ", offer);
    return offer;
};
export const setOfferExpired = async ({ offerId }) => {
    const expiredOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: EXPIRED_OFFER_STATE,
        }
    });
    return expiredOffer;
};
export const setOfferAccepted = async ({ offerId }) => {
    const acceptedOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: ACCEPTED_OFFER_STATE,
        }
    });
    return acceptedOffer;
};
export const setOfferOpen = async ({ offerId }) => {
    const openOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: OPEN_OFFER_STATE,
        }
    });
    return openOffer;
};
export const setOfferRejected = async ({ offerId }) => {
    const rejectedOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: REJECTED_OFFER_STATE,
        }
    });
    return rejectedOffer;
};
//# sourceMappingURL=offer-update.js.map