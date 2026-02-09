// Only prisma logic should go here. No other business logic.

import { prisma } from "../auth.js";
import type { Offer } from '../../types.js';
import { ACCEPTED_OFFER_STATE, OPEN_OFFER_STATE } from "../../types.js";

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
                            displayUsername: true,
                            avatarUrl: true
                        }
                    },
                    acceptedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true,
                            displayUsername: true,
                            avatarUrl: true
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
                            displayUsername: true,
                            avatarUrl: true
                        }
                    },
                    acceptedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true,
                            displayUsername: true,
                            avatarUrl: true
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

export const getAcceptedOfferByMeetingId = async ({meetingId}: {meetingId: string}): Promise<Offer | null> => {
    const offer = await prisma.offer.findFirst({
        where: {
            meetingId,
            offerState: ACCEPTED_OFFER_STATE
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
                            displayUsername: true,
                            avatarUrl: true
                        }
                    },
                    acceptedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            username: true,
                            displayUsername: true,
                            avatarUrl: true
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
