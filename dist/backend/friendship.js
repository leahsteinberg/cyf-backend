import { getFriendshipsUser1Side, getFriendshipsUser2Side } from './query/friendship-lookup.js';
import { getUsersFromIds } from './query/user-lookup.js';
export const getFriends = async (id) => {
    const friendIds = await getFriendIds(id);
    const friends = await getUsersFromIds(friendIds);
    return friends;
};
export const getFriendIds = async (id) => {
    const friendshipsSide1 = await getFriendshipsUser1Side(id);
    const friendshipsSide2 = await getFriendshipsUser2Side(id);
    const friendships = [...friendshipsSide1, ...friendshipsSide2];
    const friendIds = getFriendIdsFromFriendships(id, friendships);
    return friendIds;
};
const getFriendIdsFromFriendships = (selfId, friendships) => {
    return friendships.map((friend) => {
        return selfId === friend.userId1 ? friend.userId2 : friend.userId1;
    });
};
export const findUnofferedFriends = (offeredFriends, allUserFriendIds) => {
    const unOfferedFriendIds = allUserFriendIds.filter((allUserId) => !offeredFriends.includes(allUserId));
    return unOfferedFriendIds;
};
export const pickFriendIdToOffer = (offeredFriendsIds, allUserFriendIds) => {
    const unOfferedFriendIds = findUnofferedFriends(offeredFriendsIds, allUserFriendIds);
    if (unOfferedFriendIds.length === 0) {
        return undefined;
    }
    return unOfferedFriendIds[0];
};
export const getUnofferedFriendsFromMeeting = async ({ meeting, offers, friendIds }) => {
    const userFrom = meeting.userFromId;
    if (!userFrom) {
        throw new Error('User not found for meeting');
    }
    const offeredFriends = offers.map((offer) => offer.userOfferedId.toString());
    const unOfferedFriendIds = findUnofferedFriends(offeredFriends, friendIds);
    return unOfferedFriendIds;
};
//# sourceMappingURL=friendship.js.map