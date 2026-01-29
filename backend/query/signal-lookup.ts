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
 * Gets CALL_INTENT signals from userId that target any of the friendIds.
 * In other words: "Which friends do I want to call?"
 */
export const getOutgoingCallIntents = async ({
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
            userId: userId,
        },
    });

    // Filter to only those targeting friends
    // (payload.targetUserIds may contain multiple IDs)
    return signals.filter(signal => {
        const targetIds = (signal.payload as any)?.targetUserIds || [];
        return targetIds.some((id: string) => friendIds.includes(id));
    }) as UserSignal<'CALL_INTENT'>[];
};
