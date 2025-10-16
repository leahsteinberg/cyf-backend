import {prisma } from './auth.ts';  


export const createFriendship = async ({userId1, userId2}) => {
    const friendship = await prisma.friendship.create({
        data: {
            userId1,
            userId2,
        }
        });
    return friendship;
};

export const getFriends = async (id) => {
    const friendIds = await getFriendIds(id);
    const friends = await getFriendUsersFromIds(friendIds);
    return friends;
}

export const getFriendIds = async (id) => {
    const friendshipsSide1 = await getFriendshipsUser1Side(id);
    const friendshipsSide2 = await getFriendshipsUser2Side(id);
    const friendships = [...friendshipsSide1, ...friendshipsSide2];
    const friendIds = getFriendIdsFromFriendships(id, friendships)
    return friendIds;
}

export const getFriendUsersFromIds = async (friendIds) => {
    const friendsUsers = await prisma.user.findMany({
        where: {
            id: {
                in: friendIds,
            },
        },
    });
    return friendsUsers;
}

const getFriendIdsFromFriendships = (selfId, friendships) =>  {
    return friendships.map((friend) => {
        return selfId === friend.userId1 ? friend.userId2 : friend.userId1
    })
}

const getFriendshipsUser1Side = async (id) => {
    const friendships = await prisma.friendship.findMany({
        where: { userId1: id }
    });
    return friendships || [];
}

const getFriendshipsUser2Side = async (id) => {

    const friendships = await prisma.friendship.findMany({
        where: { userId2: id }
    });
    return friendships || [];
}

const findUnofferedFriends = (offeredFriends, allUserFriendIds) => {
    
    const unOfferedFriendIds = allUserFriendIds.reduce(
        (unOffered, friendId) => {
            return offeredFriends.includes(friendId) ? [...unOffered] : [...unOffered, friendId];
        },
        []
    );
    return unOfferedFriendIds;
}


export const pickFriendIdToOffer = (offeredFriends, allUserFriendIds) => {
    
    const unOfferedFriendIds = findUnofferedFriends(offeredFriends, allUserFriendIds);
    if (unOfferedFriendIds.length === 0) {
        return null
    }
    return unOfferedFriendIds[0]
}