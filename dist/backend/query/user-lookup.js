// Only prisma logic should go here. No other business logic.
import { prisma } from "../auth.js";
import { getCreatedMeetings } from "./meeting-lookup.js";
import { isActiveBroadcastMeeting } from "../broadcast-to-user.js";
export const getUsersFromIds = async (userIds) => {
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: userIds,
            },
        },
    });
    return users;
};
export const findUserByPhone = async (phoneNumber) => {
    const user = await prisma.user.findUnique({
        where: { phoneNumber },
    });
    if (user) {
        console.log('User found:', user);
        return user;
    }
    else {
        console.log('User not found.');
        return null;
    }
};
export const getUserPushToken = async ({ userId }) => {
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
export const getUserTimezone = async ({ userId }) => {
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
export const getIsBroadcasting = async ({ userId }) => {
    const meetings = await getCreatedMeetings({ userFromId: userId });
    return meetings.some(isActiveBroadcastMeeting);
};
export const getUserPhoneNumber = async ({ userId }) => {
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
export const getUserContextInfo = async ({ userId }) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            displayUsername: true,
            timezone: true,
            isBroadcasting: true,
            createdAt: true
        }
    });
    return user;
};
//# sourceMappingURL=user-lookup.js.map