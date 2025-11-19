import { prisma } from "../auth.js";

export const getFriendshipsUser1Side = async (id: string) => {
    const friendships = await prisma.friendship.findMany({
        where: { userId1: id }
    });
    return friendships || [];
}

export const getFriendshipsUser2Side = async (id: string) => {

    const friendships = await prisma.friendship.findMany({
        where: { userId2: id }
    });
    return friendships || [];
}