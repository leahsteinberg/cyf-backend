import { prisma } from "../auth.js";
import type { Offer } from '../../types.js';
import { OPEN_OFFER_STATE } from "../utils.js";

export const getOffersForUser = async ({userId}: {userId: string}): Promise<Offer[]> => {
    const offers = await prisma.offer.findMany({
        where: {
            userOfferedId: userId,
            offerState: OPEN_OFFER_STATE
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
                    },
                    acceptedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true,
                            displayUsername: true
                        }
                    },
                    broadcastMetadata: true,
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
    const offer = await prisma.offer.findUnique({
        where:
        {
            id: offerId
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
                    },
                    acceptedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true,
                            displayUsername: true
                        }
                    },
                    broadcastMetadata: true
                }
            },
            userOffered: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                }
            }
        }
    });
    return offer;
};

export const getMeetingOffers = async ({meetingId}: {meetingId: string}): Promise<Offer[]> => {
    const offers = await prisma.offer.findMany({
        where: {
            meetingId
        },
        include: {
            userOffered: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true
                }
            }
        }
    })
    return offers;
};
