import type { Meeting, User, Offer } from '../types.js';
export declare const getFriends: (id: string) => Promise<User[]>;
export declare const getFriendIds: (id: string) => Promise<string[]>;
export declare const findUnofferedFriends: (offeredFriends: string[], allUserFriendIds: string[]) => string[];
export declare const pickFriendIdToOffer: (offeredFriendsIds: string[], allUserFriendIds: string[]) => string | undefined;
export declare const getUnofferedFriendsFromMeeting: ({ meeting, offers, friendIds }: {
    meeting: Meeting;
    offers: Offer[];
    friendIds: string[];
}) => Promise<string[]>;
//# sourceMappingURL=friendship.d.ts.map