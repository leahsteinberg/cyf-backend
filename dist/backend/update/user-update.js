import { prisma } from "../auth.js";
export const updateUserPushToken = async ({ userId, pushToken, timezone }) => {
    const updatedUser = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            pushToken: pushToken,
            ...(timezone && { timezone })
        }
    });
    console.log("Updated user push token:", updatedUser);
    return updatedUser;
};
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
export const setIsBroadcasting = async ({ userId }) => {
    const updatedUser = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            isBroadcasting: true
        }
    });
    return updatedUser;
};
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
export const setIsNotBroadcasting = async ({ userId }) => {
    const updatedUser = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            isBroadcasting: false
        }
    });
    return updatedUser;
};
//# sourceMappingURL=user-update.js.map