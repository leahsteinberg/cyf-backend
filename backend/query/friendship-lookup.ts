// Only prisma logic should go here. No other business logic.
import type { Friendship } from "../../types.js";
import { prisma } from "../auth.js";

export const getFriendshipsUser1Side = async (id: string): Promise<Friendship[]> => {
    const friendships = await prisma.friendship.findMany({
        where: { userId1: id }
    });
    return friendships || [];
}

export const getFriendshipsUser2Side = async (id: string): Promise<Friendship[]> => {
    const friendships = await prisma.friendship.findMany({
        where: { userId2: id }
    });
    return friendships || [];
}

export const getFriendsWithDetails = async ({ userId }: { userId: string }) => {
    const friendshipsUser1 = await getFriendshipsUser1Side(userId);
    const friendshipsUser2 = await getFriendshipsUser2Side(userId);

    const friendIds = [
        ...friendshipsUser1.map(f => f.userId2),
        ...friendshipsUser2.map(f => f.userId1)
    ];

    const friends = await prisma.user.findMany({
        where: {
            id: { in: friendIds }
        },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            displayUsername: true,
            avatarUrl: true,
            timezone: true
        }
    });

    return friends;
}