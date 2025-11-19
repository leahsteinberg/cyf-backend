import {prisma } from './auth.js';  
import { getFriendshipsUser1Side, getFriendshipsUser2Side } from './query/friendship-lookup.js';
import { getUsersFromIds } from './query/user-lookup.js';



export const getFriends = async (id) => {
    const friendIds = await getFriendIds(id);
    const friends = await getUsersFromIds(friendIds);
    return friends;
}

export const getFriendIds = async (id) => {
    const friendshipsSide1 = await getFriendshipsUser1Side(id);
    const friendshipsSide2 = await getFriendshipsUser2Side(id);
    const friendships = [...friendshipsSide1, ...friendshipsSide2];
    const friendIds = getFriendIdsFromFriendships(id, friendships)
    return friendIds;
}

const getFriendIdsFromFriendships = (selfId, friendships) =>  {
    return friendships.map((friend) => {
        return selfId === friend.userId1 ? friend.userId2 : friend.userId1
    })
}

export const findUnofferedFriends = (offeredFriends: string[], allUserFriendIds:string[]):string[] => {

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
