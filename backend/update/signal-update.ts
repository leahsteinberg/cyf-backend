import { WALK_PATTERN_SIGNAL_TYPE, type SignalType, type UserSignal } from "../../types.js"
import { prisma } from "../auth.js"
import type { Prisma } from "@prisma/client";

export const addUserSignalForUser = async (
    {userId, signalType, payload}: {userId: string, signalType: SignalType, payload: JsonValue | null})
: Promise<UserSignal[]> => {
    const userSignals = await prisma.userSignal.create({
        data: {
            userId,
            type: WALK_PATTERN_SIGNAL_TYPE,
            payload: payload,
        }
    })
    return [userSignals];

}