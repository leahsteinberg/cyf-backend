import { prisma } from "../auth.js";

export const getUsersFromIds = async (userIds: string[]) => {
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: userIds,
            },
        },
    });
    return users;
};

export const findUserByPhone = async (phoneNumber: string) => {
    const user = await prisma.user.findUnique({
        where: { phoneNumber },
        });
        if (user) {
            console.log('User found:', user);
            return user;
        } else {
            console.log('User not found.');
            return null;
        }
};

export const getUserPushToken = async ({ userId }: { userId: string }): Promise<string | null> => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            pushToken: true
        }
    });

    return user?.pushToken ?? null;
};

export const getUserTimezone = async ({ userId }: { userId: string }): Promise<string | null> => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            timezone: true
        }
    });

    return user?.timezone ?? null;
};

export const getIsBroadcasting = async ({ userId }: { userId: string }): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            isBroadcasting: true
        }
    });

    return user?.isBroadcasting ?? false;
};

export const getUserPhoneNumber = async ({ userId }: { userId: string }): Promise<string | null> => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            phoneNumber: true
        }
    });

    return user?.phoneNumber ?? null;
};