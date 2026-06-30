// Only prisma logic should go here. No other business logic.

import { prisma } from "../auth.js";

export const getPendingInvitePhoneNumbers = async ({ userFromId }: { userFromId: string }): Promise<Set<string>> => {
    const invites = await prisma.invitation.findMany({
        where: { userFromId },
        select: { userToPhoneNumber: true },
    });
    return new Set(invites.map(i => i.userToPhoneNumber));
};

export const findInvite = async (token: string, userToPhoneNumber: string) => {
    const invite = await prisma.invitation.findFirst({
        where: { token, userToPhoneNumber },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true,
                    avatarUrl: true,
                    phoneNumber: true
                }
            }
        }
    });
    return invite;
};


export const getSentInvites = async ({userFromId}: {userFromId: string}) => {
    const sentInvites = await prisma.invitation.findMany({
        where: { userFromId },
        select: {
            id: true,
            token: true,
            userFromId: true,
            userToPhoneNumber: true,
            createdAt: true,
            accepted: true,
        },
    });

    if (sentInvites.length === 0) return sentInvites.map(i => ({ ...i, inviteeUser: null }));

    const phoneNumbers = sentInvites.map(i => i.userToPhoneNumber);
    const inviteeUsers = await prisma.user.findMany({
        where: { phoneNumber: { in: phoneNumbers } },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            displayUsername: true,
            avatarUrl: true,
            phoneNumber: true,
        },
    });

    const userByPhone = new Map(inviteeUsers.map(u => [u.phoneNumber, u]));

    return sentInvites.map(invite => ({
        ...invite,
        inviteeUser: userByPhone.get(invite.userToPhoneNumber) ?? null,
    }));
};

export const getFriendInvites = async ({userToPhoneNumber}: {userToPhoneNumber: string}) => {
    const friendInvites = await prisma.invitation.findMany({
        where: {
            userToPhoneNumber
        },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true,
                    avatarUrl: true,
                    phoneNumber: true,
                },
            },
        },
    });
    return friendInvites;
};
