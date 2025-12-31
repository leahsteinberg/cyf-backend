export declare const getUsersFromIds: (userIds: string[]) => Promise<{
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
    pushToken: string | null;
    timezone: string | null;
    isBroadcasting: boolean;
    displayUsername: string | null;
}[]>;
export declare const findUserByPhone: (phoneNumber: string) => Promise<{
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
    pushToken: string | null;
    timezone: string | null;
    isBroadcasting: boolean;
    displayUsername: string | null;
} | null>;
export declare const getUserPushToken: ({ userId }: {
    userId: string;
}) => Promise<string | null>;
export declare const getUserTimezone: ({ userId }: {
    userId: string;
}) => Promise<string | null>;
export declare const getIsBroadcasting: ({ userId }: {
    userId: string;
}) => Promise<boolean>;
export declare const getUserPhoneNumber: ({ userId }: {
    userId: string;
}) => Promise<string | null>;
export declare const getUserContextInfo: ({ userId }: {
    userId: string;
}) => Promise<{
    email: string;
    username: string | null;
    id: string;
    createdAt: Date;
    name: string | null;
    timezone: string | null;
    isBroadcasting: boolean;
    displayUsername: string | null;
} | null>;
//# sourceMappingURL=user-lookup.d.ts.map