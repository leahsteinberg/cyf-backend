import type { Request, Response } from 'express';
import { getFriendIds } from '../backend/friendship.js';
import { createMeeting } from '../backend/update/meeting-update.js';
import { addHour } from '../backend/utils.js';
import { processNewBroadcastMeeting } from '../backend/process-broadcast.js';
import { getOfferById } from '../backend/query/offer-lookup.js';
import { acceptOffer } from '../backend/offer.js';
import { getAcceptedMeetings } from '../backend/query/meeting-lookup.js';

export const handleBroadcastNow = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("broadcast now --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const scheduledFor = new Date();
        const scheduledEnd = addHour(scheduledFor);

        const meeting = await createMeeting({
            userFromId: userId,
            scheduledFor,
            scheduledEnd,
            title: 'This is a broadcast meeting',
            meetingType: 'BROADCAST',
        });
        const processedBroadcast = await processNewBroadcastMeeting({ meeting });
        res.json({ success: true, userId, meeting: processedBroadcast });
    } catch (error) {
        console.error("Error in broadcast now:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleBroadcastEnd = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("broadcast end --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // TODO: Implement broadcast end logic

        res.json({ success: true, userId });
    } catch (error) {
        console.error("Error in broadcast end:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleTryAcceptBroadcast = async (req: Request, res: Response) => {
    const { userId, offerId } = req.body;
    console.log("try accept broadcast --", { userId, offerId });

    if (!userId || !offerId) {
        return res.status(400).json({ error: "userId and offerId are required" });
    }

    try {
        // Check if the offer exists
        const offer = await getOfferById({ offerId });
        if (!offer) {
            return res.status(404).json({ error: "Offer not found", canAccept: false });
        }

        // Check if the offer is still open
        if (offer.offerState !== 'OPEN') {
            return res.status(400).json({
                error: "Offer is no longer available",
                canAccept: false,
                offerState: offer.offerState
            });
        }

        // Check if user has any conflicting accepted meetings
        const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userId });

        // For now, allow accepting if no conflicts (you can add time-based conflict checking here)
        const canAccept = true;

        res.json({
            success: true,
            canAccept,
            offer
        });
    } catch (error) {
        console.error("Error in try accept broadcast:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleAcceptBroadcast = async (req: Request, res: Response) => {
    const { userId, offerId } = req.body;
    console.log("accept broadcast --", { userId, offerId });

    if (!userId || !offerId) {
        return res.status(400).json({ error: "userId and offerId are required" });
    }

    try {
        // Use the existing acceptOffer logic
        const acceptedOffer = await acceptOffer({ userId, offerId });

        res.json({
            success: true,
            offer: acceptedOffer
        });
    } catch (error) {
        console.error("Error accepting broadcast:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleRejectBroadcast = async (req: Request, res: Response) => {
    const { userId, offerId } = req.body;
    console.log("reject broadcast --", { userId, offerId });

    if (!userId || !offerId) {
        return res.status(400).json({ error: "userId and offerId are required" });
    }

    try {
        // Import rejectOffer from offer.js
        const { rejectOffer } = await import('../backend/offer.js');

        // Reject the broadcast offer
        const rejectedOffer = await rejectOffer({ offerId });

        res.json({
            success: true,
            offer: rejectedOffer
        });
    } catch (error) {
        console.error("Error rejecting broadcast:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
