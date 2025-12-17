import type { Request, Response } from 'express';
import { getUserSignalsForUser } from '../backend/query/signal-lookup.js';
import { addSignalForUser, removeSignalForUser } from '../backend/update/signal-update.js';
import { CALL_INTENT_SIGNAL_TYPE } from '../types.js';
import { prisma } from '../backend/auth.js';


export const handleGetUserSignals = async (req: Request, res: Response) => {
    const {  userId } = req.body;

    console.log("Get user signals:", { userId });

    try {
        const userSignals = await getUserSignalsForUser({userId});

        res.json(userSignals);
    } catch (error) {
        console.error("Error getting user signals:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to get user signals",
            details: errorMessage
        });
    }
};

export const handleAddUserSignal = async (req: Request, res: Response) => {
    const { userId, payload, type  } = req.body;
    console.log("Add user signal from ",userId, type);

    try {
        // Check for duplicate CALL_INTENT with same targetUserId
        if (type === CALL_INTENT_SIGNAL_TYPE) {
            const targetUserId = payload?.targetUserId;
            if (targetUserId) {
                const existingSignals = await prisma.userSignal.findMany({
                    where: {
                        userId,
                        type: CALL_INTENT_SIGNAL_TYPE,
                    }
                });

                const duplicate = existingSignals.find(
                    (signal: any) => signal.payload?.targetUserId === targetUserId
                );

                if (duplicate) {
                    console.log("Duplicate CALL_INTENT found, returning existing signal");
                    return res.json([duplicate]);
                }
            }
        }

        const signal = await addSignalForUser({userId, signalType: type, payload});

        res.json(signal);
    } catch (error) {
        console.error("Error add user signal:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to add user signal",
            details: errorMessage
        });
    }
};

export const handleRemoveUserSignal = async (req: Request, res: Response) => {
    const { userId, signalId } = req.body;

    console.log("Remove user signals:", { userId, signalId });

    if (!userId || !signalId) {
        return res.status(400).json({
            error: "userId and signalId are required"
        });
    }

    try {
        const deletedSignal = await removeSignalForUser({ userId, signalId });

        if (!deletedSignal) {
            return res.status(404).json({
                error: "Signal not found"
            });
        }

        console.log("Signal removed:", { signalId, userId });

        res.json({
            success: true,
            deletedSignal
        });

    } catch (error) {
        console.error("Error handleRemoveUserSignal:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('Unauthorized')) {
            return res.status(403).json({
                error: errorMessage
            });
        }

        return res.status(500).json({
            error: "Failed to remove user signal",
            details: errorMessage
        });
    }
};


