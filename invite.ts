import {prisma } from './auth.ts';  


export const findInvite = async (token, userToPhoneNumber) => {
    const invite = await prisma.invitation.findFirst({
    where: { token, userToPhoneNumber }
    });
    return invite;
};


export const createInvite = async () => {};

