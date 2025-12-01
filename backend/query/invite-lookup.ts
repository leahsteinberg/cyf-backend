import { prisma } from "../auth.js";

export const findInvite = async (token: string, userToPhoneNumber: string) => {
    const invite = await prisma.invitation.findFirst({
        where: { token, userToPhoneNumber }
    });
    return invite;
};


export const getSentInvites = async ({userFromId}: {userFromId: string}) => {
    const sentInvites = await prisma.invitation.findMany({
        where: {
            userFromId
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
                },
            },
        },
    });
    return friendInvites;
};
