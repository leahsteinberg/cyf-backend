import { prisma } from "../auth.js";

export const createFriendship = async ({userId1, userId2}: {userId1: string, userId2:string}) => {
    const friendship = await prisma.friendship.create({
        data: {
            userId1,
            userId2,
        }
        });
    return friendship;
};