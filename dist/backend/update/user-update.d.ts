export declare const updateUserPushToken: ({ userId, pushToken, timezone }: {
    userId: string;
    pushToken: string;
    timezone?: string;
}) => Promise<{
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
}>;
/**
 * DEPRECATED: isBroadcasting is now computed dynamically from meetings.
 * This function is a no-op and will be removed in a future update.
 *
 * @param userId - ID of the user
 */
export declare const setIsBroadcasting: ({ userId }: {
    userId: string;
}) => Promise<void>;
/**
 * DEPRECATED: isBroadcasting is now computed dynamically from meetings.
 * This function is a no-op and will be removed in a future update.
 *
 * @param userId - ID of the user
 */
export declare const setIsNotBroadcasting: ({ userId }: {
    userId: string;
}) => Promise<void>;
//# sourceMappingURL=user-update.d.ts.map