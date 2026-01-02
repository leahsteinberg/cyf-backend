import { prisma } from "../auth.js";

export const updateUserPushToken = async ({ userId, pushToken, timezone }: { userId: string, pushToken: string, timezone?: string }) => {
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
 * DEPRECATED: isBroadcasting is now computed dynamically from meetings.
 * This function is a no-op and will be removed in a future update.
 *
 * @param userId - ID of the user
 */
export const setIsBroadcasting = async ({ userId }: { userId: string }) => {
    // DEPRECATED: isBroadcasting is now computed dynamically
    return;
};

/**
 * DEPRECATED: isBroadcasting is now computed dynamically from meetings.
 * This function is a no-op and will be removed in a future update.
 *
 * @param userId - ID of the user
 */
export const setIsNotBroadcasting = async ({ userId }: { userId: string }) => {
    // DEPRECATED: isBroadcasting is now computed dynamically
    return;
};
