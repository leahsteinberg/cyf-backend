import type { Request, Response } from 'express';
import { getUserSignalsForUser } from '../backend/query/signal-lookup.js';
import { addSignalForUser } from '../backend/update/signal-update.js';


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
    const { userId, userSignalId } = req.body;

    console.log("Remove user signals:", { userId, userSignalId });
      try {

        res.json({});
    } catch (error) {
        console.error("Error handleRemoveUserSignal:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to remove user signal",
            details: errorMessage
        });
    }
};


