import { prisma } from "../auth.js";
import type { Offer, UserSignal } from '../../types.js';

export const getUserSignalsForUser = async ({userId}: {userId: string}): Promise<UserSignal[]> => {
    const userSignals = await prisma.userSignal.findMany({
        where: {
            userId,
        }
    });
    return userSignals;
};
