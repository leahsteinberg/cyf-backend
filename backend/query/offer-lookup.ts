import { prisma } from "../auth.js";
import type { Offer } from '../../types.js';

export const getOffersForUser = async ({userId}: {userId: string}): Promise<Offer[]> => {
    const offers = await prisma.offer.findMany({
        where: {
            userOfferedId: userId,
            offerState: 'OPEN'
        },
        include: {
            meeting: {
                include: {
                    userFrom: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true,
                            displayUsername: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    return offers;
};

export const getOfferById = async ({offerId}: {offerId: string}): Promise<Offer | null> => {
    console.log("getOfferById", offerId);
    const offer = await prisma.offer.findUnique({
        where:
        {
            id: offerId
        }
    });
    return offer;
};

export const getMeetingOffers = async ({meetingId}: {meetingId: string}): Promise<Offer[]> => {
    const offers = await prisma.offer.findMany({
        where: {
            meetingId
        }
    })
    return offers;
};
