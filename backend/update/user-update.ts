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

export const setIsBroadcasting = async ({ userId }: { userId: string }) => {
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

export const setIsNotBroadcasting = async ({ userId }: { userId: string }) => {
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
