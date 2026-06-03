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

export class FriendRequestError extends Error {
    constructor(public readonly code: 'USER_NOT_FOUND' | 'ALREADY_FRIENDS' | 'INVITE_ALREADY_SENT') {
        super(code);
    }
}

export const createFriendRequest = async ({
    userFromId,
    userToId,
}: {
    userFromId: string;
    userToId: string;
}) => {
    const [sender, recipient] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userFromId },
            select: { id: true, name: true, displayUsername: true, username: true },
        }),
        prisma.user.findUnique({
            where: { id: userToId },
            select: { id: true, phoneNumber: true, pushToken: true },
        }),
    ]);

    if (!recipient?.phoneNumber) throw new FriendRequestError('USER_NOT_FOUND');

    const [existingFriendship, existingInvite] = await Promise.all([
        prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId1: userFromId, userId2: userToId },
                    { userId1: userToId, userId2: userFromId },
                ],
            },
        }),
        prisma.invitation.findFirst({
            where: { userFromId, userToPhoneNumber: recipient.phoneNumber },
        }),
    ]);

    if (existingFriendship) throw new FriendRequestError('ALREADY_FRIENDS');
    if (existingInvite) throw new FriendRequestError('INVITE_ALREADY_SENT');

    const invite = await prisma.invitation.create({
        data: { userFromId, userToPhoneNumber: recipient.phoneNumber },
    });

    return { invite, sender, recipient };
};

export const deleteInvite = async ({inviteId}: {inviteId: string}) => {
    const deletedInvite = await prisma.invitation.delete({
        where: {
            id: inviteId
        }
    });
    return deletedInvite;
};