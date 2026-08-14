import { WALK_PATTERN_SIGNAL_TYPE, type SignalPayloadMap, type SignalType, type UserSignal } from "../../types.js"
import { prisma } from "../auth.js"

export const addSignalForUser = async <T extends SignalType>(
    {userId, signalType, payload, startsAt, endsAt}: {
        userId: string;
        signalType: T;
        payload: SignalPayloadMap[T];
        startsAt?: Date | null;
        endsAt?: Date | null;
    })
: Promise<UserSignal<SignalType>[]> => {
    const userSignals = await prisma.userSignal.create({
        data: {
            userId,
            type: signalType,
            payload: payload,
            ...(startsAt !== undefined && { startsAt }),
            ...(endsAt !== undefined && { endsAt }),
        }
    })
    return [userSignals as UserSignal<T>,];

}

export const removeSignalForUser = async (
    {userId, signalId}: {userId: string, signalId: string})
: Promise<UserSignal<SignalType> | null> => {
    const signal = await prisma.userSignal.findUnique({
        where: { id: signalId }
    });

    if (!signal) {
        return null;
    }

    if (signal.userId !== userId) {
        throw new Error('Unauthorized: Signal does not belong to user');
    }

    const deletedSignal = await prisma.userSignal.delete({
        where: { id: signalId }
    });

    return deletedSignal as UserSignal<SignalType>;
}