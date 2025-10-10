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

const getFriendIds = async (id) => {
    const friendshipsSide1 = await getFriendshipsUser1Side(id);
    const friendshipsSide2 = await getFriendshipsUser2Side(id);
    const friendships = [...friendshipsSide1, ...friendshipsSide2];
    console.log({friendships});
    const friendIds = getFriendIdsFromFriendships(id, friendships)
    console.log ({friendIds})
    return friendIds;
}

const getFriendUsersFromIds = async (friendIds) => {
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
    console.log("in get friend Ids", {selfId, friendships})
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
