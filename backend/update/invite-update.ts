import { prisma } from "../auth.js";

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