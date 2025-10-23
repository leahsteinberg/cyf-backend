import { prisma } from './auth.ts';
import { getUserFromMeeting } from './meeting.ts'
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

export const getMeetingOffers = async ({meetingId}) => {
    const offers = await prisma.offer.findMany({
        where: {
            meetingId
        }
    })
    return offers;
}

export const getOfferedFriendsFromOffer = async () => {

}

export const findFriendIdToOffer = async ({offers, meetingId}) => {
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

export const acceptOffer = async () => {};

export const rejectOffer = async () => {};

export const findAcceptedOffer = async () => {};// from a particular meeting

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
