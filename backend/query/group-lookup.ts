// Only prisma logic should go here. No other business logic.

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

export const getGroupById = async ({ groupId }: { groupId: string }): Promise<FriendGroup | null> => {
    const group = await prisma.friendGroup.findUnique({
        where: { id: groupId },
        include: memberInclude,
    });
    return group;
};

export const getGroupsByOwner = async ({ ownerId }: { ownerId: string }): Promise<FriendGroup[]> => {
    const groups = await prisma.friendGroup.findMany({
        where: { ownerId },
        include: memberInclude,
        orderBy: { createdAt: 'asc' },
    });
    return groups;
};
