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
