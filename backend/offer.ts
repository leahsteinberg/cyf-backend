import { prisma } from './auth.ts';
import { getUserFromMeeting, setMeetingAccepted } from './meeting.ts'
import { getFriendIds, pickFriendIdToOffer } from './friendship.ts';

export const createOffer = async ({meetingId, userOfferedId}) => {
    const offer = await prisma.offer.create({
        data: {
            meetingId,
            userOfferedId,
            offerState: 'OPEN'
        }
    })
    return offer;
};


export const setOfferExpired = async ({offerId}) => {
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

export const acceptOffer = async ({ userId, offerId }) => {
    const offer = await getOfferById({offerId})
    console.log("got offer", offer);
    const meetingId = offer?.meetingId;
    
    const acceptedOffer = await prisma.offer.update({
        where: {
            id: offerId,
        },
        data: {
            offerState: 'ACCEPTED',
        }

    })
    console.log("accepted offer --- ", acceptedOffer)
    const acceptedMeeting = await setMeetingAccepted({ meetingId, userId });
    console.log("accepted meeting - ", acceptedMeeting);
    return acceptedOffer;

};


export const getOffersForUser = async ({userId}) => {
    const offers = await prisma.offer.findMany({
        where: {
            userOfferedId: userId
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

export const getOfferById = async ({offerId}) => {
    console.log("getOfferById", offerId);
    const offer = await prisma.offer.findUnique({
        where:
        {
            id: offerId
        }
    });
    return offer;
}


export const findFriendIdToOffer = async ({offers, meetingId}) => {
    // TODO - in the future, do this in a more systematic, yet randomized way.
    const userFrom = await getUserFromMeeting(meetingId);
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }
    const allUserFriendIds = await getFriendIds(userFrom.id);
    console.log("all user FriendIDs", allUserFriendIds)
    const offeredFriends = offers.reduce(
        (friendsOffered, offer) => {
            const userOfferedId = offer.userOfferedId.toString()
                return [...friendsOffered, userOfferedId]
            },
        []
    );
    const friendToOfferId = pickFriendIdToOffer(offeredFriends, allUserFriendIds)
    return friendToOfferId;
}

export const findRecentOffer = (offers) => {
    if (offers.length > 0) {
        const recentOffer = offers.reduce((recent, curr) => {
            return  recent.createdAt.getTime() > curr.createdAt.getTime() ? recent : curr
        }, offers[0])
        return recentOffer
    }
    return null
    
}

export const getMeetingOffers = async ({meetingId}) => {
    const offers = await prisma.offer.findMany({
        where: {
            meetingId
        }
    })
    return offers;
}

export const determineNeedNewOffer = async ({remainingFriendCount, minutesUntilMeeting}) => {
    if (minutesUntilMeeting <= 60) {
        return false;
    }
    
    return false;
};