import { prisma } from "../auth.js";
export const createInvite = async ({ userFromId, userToPhoneNumber }) => {
    const invite = await prisma.invitation.create({
        data: {
            userFromId,
            userToPhoneNumber,
        }
    });
    console.log("create invite - ", invite);
    return invite;
};
export const deleteInvite = async ({ inviteId }) => {
    const deletedInvite = await prisma.invitation.delete({
        where: {
            id: inviteId
        }
    });
    return deletedInvite;
};
//# sourceMappingURL=invite-update.js.map