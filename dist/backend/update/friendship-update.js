import { prisma } from "../auth.js";
export const createFriendship = async ({ userId1, userId2 }) => {
    const friendship = await prisma.friendship.create({
        data: {
            userId1,
            userId2,
        }
    });
    return friendship;
};
//# sourceMappingURL=friendship-update.js.map