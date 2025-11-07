export declare const createFriendship: ({ userId1, userId2 }: {
    userId1: any;
    userId2: any;
}) => Promise<{
    id: string;
    userId1: string;
    userId2: string;
}>;
export declare const getFriends: (id: any) => Promise<{
    phoneNumber: string | null;
    email: string;
    phoneNumberVerified: boolean | null;
    username: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    emailVerified: boolean;
    name: string | null;
    image: string | null;
    displayUsername: string | null;
}[]>;
export declare const getFriendIds: (id: any) => Promise<any>;
export declare const getFriendUsersFromIds: (friendIds: any) => Promise<{
    phoneNumber: string | null;
    email: string;
    phoneNumberVerified: boolean | null;
    username: string | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    emailVerified: boolean;
    name: string | null;
    image: string | null;
    displayUsername: string | null;
}[]>;
export declare const findUnofferedFriends: (offeredFriends: any, allUserFriendIds: any) => any;
export declare const pickFriendIdToOffer: (offeredFriends: any, allUserFriendIds: any) => any;
//# sourceMappingURL=friendship.d.ts.map