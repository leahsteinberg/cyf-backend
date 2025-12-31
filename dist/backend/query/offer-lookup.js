import { prisma } from "../auth.js";
import { ACCEPTED_OFFER_STATE, OPEN_OFFER_STATE } from "../../types.js";
export const getOffersForUser = async ({ userId }) => {
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
export const getOfferById = async ({ offerId }) => {
    const offer = await prisma.offer.findUnique({
        where: {
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
export const getMeetingOffers = async ({ meetingId }) => {
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
    });
    return offers;
};
export const getAcceptedOfferByMeetingId = async ({ meetingId }) => {
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
//# sourceMappingURL=offer-lookup.js.map