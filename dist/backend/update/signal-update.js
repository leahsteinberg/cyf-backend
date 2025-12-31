import { WALK_PATTERN_SIGNAL_TYPE } from "../../types.js";
import { prisma } from "../auth.js";
export const addSignalForUser = async ({ userId, signalType, payload }) => {
    const userSignals = await prisma.userSignal.create({
        data: {
            userId,
            type: signalType,
            payload: payload,
        }
    });
    return [userSignals,];
};
export const removeSignalForUser = async ({ userId, signalId }) => {
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
    return deletedSignal;
};
//# sourceMappingURL=signal-update.js.map