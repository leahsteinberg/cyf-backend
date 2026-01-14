// Only prisma logic should go here. No other business logic.

import { prisma } from "../auth.js";

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
                    phoneNumber: true
                }
            }
        }
    });
    return invite;
};


export const getSentInvites = async ({userFromId}: {userFromId: string}) => {
    const sentInvites = await prisma.invitation.findMany({
        where: {
            userFromId
        },
        include: {
            userFrom: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    displayUsername: true,
                    phoneNumber: true
                }
            }
        }
    });
    return sentInvites;
};

export const getFriendInvites = async ({userToPhoneNumber}: {userToPhoneNumber: string}) => {
    const friendInvites = await prisma.invitation.findMany({
        where: {
            userToPhoneNumber
        },
        include: {
            userFrom: {
                select: {
                    name: true,
                    phoneNumber: true,
                },
            },
        },
    });
    return friendInvites;
};
