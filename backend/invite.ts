import { prisma } from './auth.js';  

//// MUTATE

export const createInvite = async ({userFromId, userToPhoneNumber}: {userFromId: string, userToPhoneNumber: string}) => {
    const invite = await prisma.invitation.create({
      data: {
        userFromId,
        userToPhoneNumber,
      }
    });
    console.log("create invite - ", invite)
    return invite;
};

export const removeCompletedInvite = async () => {};

//// LOOK UP

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

export const getIncomingInvites = async () => {};

