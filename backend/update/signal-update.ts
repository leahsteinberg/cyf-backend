import { WALK_PATTERN_SIGNAL_TYPE, type SignalPayloadMap, type SignalType, type UserSignal } from "../../types.js"
import { prisma } from "../auth.js"

export const addSignalForUser = async <T extends SignalType>(
    {userId, signalType, payload}: {userId: string, signalType: T, payload: SignalPayloadMap[T]})
: Promise<UserSignal<SignalType>[]> => {
    const userSignals = await prisma.userSignal.create({
        data: {
            userId,
            type: signalType,
            payload: payload,
        }
    })
    return [userSignals as UserSignal<T>,];

}