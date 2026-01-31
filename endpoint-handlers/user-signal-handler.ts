import type { Request, Response } from 'express';
import { getUserSignalsForUser } from '../backend/query/signal-lookup.js';
import { addSignalForUser, removeSignalForUser } from '../backend/update/signal-update.js';
import { CALL_INTENT_SIGNAL_TYPE } from '../types.js';
import { createCallIntent } from '../backend/call-intent-creator.js';
import { onePerUserSignals } from '../backend/signal-utils.js';
import { eventBus, EVENT_TYPES } from '../backend/events/index.js';
import { getUserContextInfo } from '../backend/query/user-lookup.js';


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
    const { userId, payload, type } = req.body;
    console.log("Add user signal from ",userId, type);

    try {
        const existingSignals = await getUserSignalsForUser({ userId });

        // Check for duplicate CALL_INTENT with same targetUserIds
        if (type === CALL_INTENT_SIGNAL_TYPE) {
            // Support both old format (targetUserId: string) and new format (targetUserIds: string[])
            const targetUserIds = payload?.targetUserIds || (payload?.targetUserId ? [payload.targetUserId] : null);
            if (targetUserIds && targetUserIds.length > 0) {
                const existingCallIntentSignals = existingSignals.filter((signal) => signal.type === CALL_INTENT_SIGNAL_TYPE)

                // Check if there's a duplicate with the same targetUserIds
                const duplicate = existingCallIntentSignals.find((signal: any) => {
                    const existingTargetIds = signal.payload?.targetUserIds || (signal.payload?.targetUserId ? [signal.payload.targetUserId] : []);
                    return JSON.stringify(existingTargetIds.sort()) === JSON.stringify(targetUserIds.sort());
                });

                if (duplicate) {
                    console.log("Duplicate CALL_INTENT found, returning existing signal");
                    return res.json([duplicate]);
                } else {
                    // TODO: should be deprecated once Suggestion Engine is running.
                    // For backward compatibility, if single target, use createCallIntent
                    // if (targetUserIds.length === 1) {
                    //     await createCallIntent({userId, targetUserId: targetUserIds[0]});
                    // }
                }
            }
        }

        if (onePerUserSignals.includes(type)) {
            // check if there are signals of this type for this user,
            // if so, we need to overwrite it by removing old ones first
            const duplicates = existingSignals.filter((signal) => signal.type === type);
            for (const duplicate of duplicates) {
                await removeSignalForUser({ userId, signalId: duplicate.id });
            }
        }

        const signal = await addSignalForUser({userId, signalType: type, payload});

        // Emit event for CALL_INTENT to notify target user
        if (type === CALL_INTENT_SIGNAL_TYPE && payload?.targetUserId && signal[0]) {
            const fromUser = await getUserContextInfo({ userId });
            eventBus.emitEvent({
                type: EVENT_TYPES.CALL_INTENT_CREATED,
                signalId: signal[0].id,
                fromUserId: userId,
                targetUserId: payload.targetUserId,
                fromUserDisplayName: fromUser?.displayUsername
                    || fromUser?.username
                    || fromUser?.name
                    || 'A friend',
            });
        }

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


