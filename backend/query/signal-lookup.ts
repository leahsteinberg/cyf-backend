// Only prisma logic should go here. No other business logic.

import { prisma } from "../auth.js";
import type { SignalType, UserSignal } from '../../types.js';
import { CALL_INTENT_SIGNAL_TYPE } from '../../types.js';

export const getUserSignalsForUser = async ({userId}: {userId: string}): Promise<UserSignal<SignalType>[]> => {
    const userSignals = await prisma.userSignal.findMany({
        where: {
            userId,
        }
    });
    return userSignals as UserSignal<SignalType>[];
};

/**
 * Gets CALL_INTENT signals where someone in friendIds targets the userId.
 * In other words: "Which of my friends want to call me?"
 */
export const getIncomingCallIntents = async ({
    userId,
    friendIds
}: {
    userId: string;
    friendIds: string[];
}): Promise<UserSignal<'CALL_INTENT'>[]> => {
    if (friendIds.length === 0) {
        return [];
    }

    const signals = await prisma.userSignal.findMany({
        where: {
            type: CALL_INTENT_SIGNAL_TYPE,
            userId: { in: friendIds },
            payload: {
                path: ['targetUserIds'],
                array_contains: userId,
            },
        },
    });

    return signals as UserSignal<'CALL_INTENT'>[];
};

/**
 * Gets all CALL_INTENT signals for a user.
 */
export const getCallIntentsForUser = async ({
    userId
}: {
    userId: string;
}): Promise<UserSignal<'CALL_INTENT'>[]> => {
    const signals = await prisma.userSignal.findMany({
        where: {
            type: CALL_INTENT_SIGNAL_TYPE,
            userId: userId,
        },
    });

    return signals as UserSignal<'CALL_INTENT'>[];
};
