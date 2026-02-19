import type { FriendGroup } from "../../types.js";
import { prisma } from "../auth.js";

const memberInclude = {
    members: {
        include: {
            user: {
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
    },
};

export const createGroup = async ({ name, ownerId, memberIds }: {
    name: string;
    ownerId: string;
    memberIds: string[];
}): Promise<FriendGroup> => {
    const group = await prisma.friendGroup.create({
        data: {
            name,
            ownerId,
            members: {
                create: memberIds.map(userId => ({ userId })),
            },
        },
        include: memberInclude,
    });
    return group;
};

export const addGroupMember = async ({ groupId, userId }: { groupId: string; userId: string }): Promise<void> => {
    await prisma.groupMember.create({
        data: { groupId, userId },
    });
};

export const removeGroupMember = async ({ groupId, userId }: { groupId: string; userId: string }): Promise<void> => {
    await prisma.groupMember.deleteMany({
        where: { groupId, userId },
    });
};

export const deleteGroup = async ({ groupId }: { groupId: string }): Promise<void> => {
    await prisma.friendGroup.delete({
        where: { id: groupId },
    });
};
