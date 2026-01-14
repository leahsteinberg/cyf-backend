// Only prisma logic should go here. No other business logic.

import { prisma } from "../auth.js";
import type { SignalType, UserSignal } from '../../types.js';

export const getUserSignalsForUser = async ({userId}: {userId: string}): Promise<UserSignal<SignalType>[]> => {
    const userSignals = await prisma.userSignal.findMany({
        where: {
            userId,
        }
    });
    return userSignals as UserSignal<SignalType>[];
};
