import type { Meeting, User, Offer, Friendship } from '../types.js';
import {prisma } from './auth.js';  
import { getFriendshipsUser1Side, getFriendshipsUser2Side } from './query/friendship-lookup.js';
import { getUsersFromIds } from './query/user-lookup.js';




export const getFriends = async (id: string): Promise<User[]> => {
    const friendIds = await getFriendIds(id);
    const friends = await getUsersFromIds(friendIds);
    return friends;
}

export const getFriendIds = async (id: string): Promise<string[]> => {
    const friendshipsSide1 = await getFriendshipsUser1Side(id);
    const friendshipsSide2 = await getFriendshipsUser2Side(id);
    const friendships = [...friendshipsSide1, ...friendshipsSide2];
    const friendIds = getFriendIdsFromFriendships(id, friendships)
    return friendIds;
}

const getFriendIdsFromFriendships = (selfId: string, friendships: Friendship[]): Promise<string[]> =>  {
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


export const pickFriendIdToOffer = (offeredFriends: string[], allUserFriendIds: string[]): string|undefined => {
    
    const unOfferedFriendIds = findUnofferedFriends(offeredFriends, allUserFriendIds);
    if (unOfferedFriendIds.length === 0) {
        return undefined;
    }
    return unOfferedFriendIds[0]
}


export const getUnofferedFriendsFromMeeting = async ({meeting, offers, friendIds}:
    {meeting: Meeting; offers: Offer[]; friendIds: string[]}): Promise<string[]> => {
    const userFrom = meeting.userFromId;
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }
    const offeredFriends = offers.map((offer: Offer): string => offer.userOfferedId.toString());
    const unOfferedFriendIds = findUnofferedFriends(offeredFriends, friendIds);
    return unOfferedFriendIds;
}
