import { prisma } from "../auth.js";
export const getUserSignalsForUser = async ({ userId }) => {
    const userSignals = await prisma.userSignal.findMany({
        where: {
            userId,
        }
    });
    return userSignals;
};
//# sourceMappingURL=signal-lookup.js.map