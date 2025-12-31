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
 * Sets the isBroadcasting flag to true for a user.
 *
 * **IMPORTANT**: This flag indicates OPEN broadcasts (broadcasting to all friends) ONLY.
 * For targeted broadcasts (to specific users or groups), this flag is NOT set.
 *
 * **Use cases**:
 * - User starts an OPEN broadcast (IMMEDIATE + OPEN)
 * - OPEN broadcast re-spawning after acceptor cancels
 *
 * **Do not use for**:
 * - Targeted broadcasts (FRIEND_SPECIFIC or GROUP)
 * - Checking if a user is broadcasting (use isBroadcasting() or isBroadcastingToUser() instead)
 *
 * @param userId - ID of the user to mark as broadcasting
 * @returns Updated user object
 *
 * @see isBroadcastingToUser - For viewer-specific broadcast checks
 * @see isBroadcasting - For global broadcast checks
 */
export declare const setIsBroadcasting: ({ userId }: {
    userId: string;
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
 * Sets the isBroadcasting flag to false for a user.
 *
 * **IMPORTANT**: This flag indicates OPEN broadcasts (broadcasting to all friends) ONLY.
 *
 * **Use cases**:
 * - User ends their OPEN broadcast
 * - OPEN broadcast becomes invalid (expired, canceled, etc.)
 * - System cleanup of stale OPEN broadcasts
 *
 * **Do not use for**:
 * - Targeted broadcasts (they never set the flag in the first place)
 *
 * @param userId - ID of the user to mark as not broadcasting
 * @returns Updated user object
 *
 * @see isBroadcastingToUser - For viewer-specific broadcast checks
 * @see isBroadcasting - For global broadcast checks
 */
export declare const setIsNotBroadcasting: ({ userId }: {
    userId: string;
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
//# sourceMappingURL=user-update.d.ts.map