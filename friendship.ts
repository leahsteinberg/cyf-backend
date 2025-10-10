import {prisma } from './auth.ts';  


export const createFriendship = async ({userId1, userId2}) => {
    const friendship = await prisma.friendship.create({
        data: {
            userId1,
            userId2,
        }
        });
    return friendship;
};

export const getAllFriendships = async (id) => {
    const friendshipsSide1 = await getOneDirectionOfFriendships("userId1", id);
    const friendshipsSide2 = await getOneDirectionOfFriendships("userId2", id);
    console.log({friendshipsSide1, friendshipsSide2});
    return [...friendshipsSide1, ...friendshipsSide2];
}

const getOneDirectionOfFriendships = async (fieldName: String, id) => {
    const friendships = await prisma.friendship.findMany({
        where: {
            fieldName: id
        }
    });
    console.log("friendships", friendships);
    return friendships || [];
}

export const findFriendship = async () => {};