import type { Request, Response } from 'express';


export const handleGetUserSignals = async (req: Request, res: Response) => {
    const {  userId } = req.body;

    console.log("Get user signals:", { userId });


    try {

        res.json({
            success: true,
        });
    } catch (error) {
        console.error("Error dismissing suggestion:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Failed to dismiss suggestion",
            details: errorMessage
        });
    }
};

export const handleAddUserSignal = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("Add user signal");
    
    try {

        res.json({});
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


