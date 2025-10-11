import { prisma } from './auth.ts';  


export const findInvite = async (token, userToPhoneNumber) => {
    const invite = await prisma.invitation.findFirst({
        where: { token, userToPhoneNumber }
    });
    return invite;
};

export const removeCompletedInvite = async () => {};

export const getSentInvites = async ({userFromId}) => {
    const sentInvites = await prisma.invitation.findMany({
        where: {
            userFromId
        }
    });
    return sentInvites;
};

export const getIncomingInvites = async () => {};

export const createInvite = async ({userFromId, userToPhoneNumber}) => {
    const invite = await prisma.invitation.create({
      data: {
        userFromId,
        userToPhoneNumber,
      }
    });
    console.log("create invite - ", invite)
    return invite;
};

