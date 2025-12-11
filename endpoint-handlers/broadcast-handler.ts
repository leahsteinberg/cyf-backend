import type { Request, Response } from 'express';
import { createMeeting, unclaimBroadcastMeeting } from '../backend/update/meeting-update.js';
import { addHour } from '../backend/utils.js';
import { processNewBroadcastMeeting, tryAcceptUnclaimedBroadcast, validateBroadcastRequest } from '../backend/process-broadcast.js';
import { acceptOffer, rejectOffer } from '../backend/offer.js';
import { getCreatedMeetings, getMeetingById } from '../backend/query/meeting-lookup.js';
import { deleteBroadcastedMeeting, findBroadcastedMeetings } from '../backend/meeting.js';
import { setIsBroadcasting, setIsNotBroadcasting } from '../backend/update/user-update.js';
import { getIsBroadcasting } from '../backend/query/user-lookup.js';
import { setBroadcastClaimed, setBroadcastUnclaimed } from '../backend/update/broadcast-update.js';
import { setOfferOpen } from '../backend/update/offer-update.js';

export const handleBroadcastNow = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("broadcast now --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // Check if user already has an active broadcast
        const createdMeetings = await getCreatedMeetings({userFromId: userId});
        const activeBroadcast = createdMeetings.find(m =>
            m.meetingType === 'BROADCAST' && m.meetingState !== 'PAST'
        );

        if (activeBroadcast) {
            return res.status(409).json({
                error: "You already have an active broadcast",
                existingBroadcast: activeBroadcast
            });
        }

        const scheduledFor = new Date();
        const scheduledEnd = addHour(scheduledFor);

        const meeting = await createMeeting({
            userFromId: userId,
            scheduledFor,
            scheduledEnd,
            title: 'This is a broadcast meeting',
            meetingType: 'BROADCAST',
        });

        // Validate meeting was created successfully before creating offers
        if (!meeting || !meeting.id) {
            return res.status(500).json({ error: "Failed to create broadcast meeting" });
        }

        const processedBroadcast = await processNewBroadcastMeeting({ meeting });

        // Set user as broadcasting
        await setIsBroadcasting({ userId });

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
        const meetings = await getCreatedMeetings({userFromId: userId});
        const broadcastMeetings = await findBroadcastedMeetings(meetings);
        // should be just one meeting, but want to account for error state
        // where there are somehow two broadcast meetings.
        for (let broadcastMeeting of broadcastMeetings) {
            await deleteBroadcastedMeeting(broadcastMeeting);
        }

        // Set user as not broadcasting
        await setIsNotBroadcasting({ userId });

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

    try {
        // Validate broadcast request
        const validation = await validateBroadcastRequest({ userId, offerId });
        if (!validation.valid) {
            return res.status(validation.statusCode).json({
                error: validation.error,
                canAccept: false
            });
        }

        const { offer, meeting } = validation;

            // Check if the offer is still open
        if (offer.offerState !== 'OPEN') {
            return {
                valid: false,
                error: "Offer is no longer available",
                statusCode: 403
            };
        }

        const broadcastSubState = meeting.broadcastMetadata?.subState;
        let canAccept = false;

        if (broadcastSubState === 'UNCLAIMED') {
            await tryAcceptUnclaimedBroadcast({meeting: meeting, offerId: offer.id})

            
        } else if (broadcastSubState === 'CLAIMED') {
            canAccept = false;
        } else if (broadcastSubState === 'PENDING_CLAIMED') {
            // Check if this user has the pending claim
            if (meeting.broadcastMetadata?.offerClaimedId === offerId) {
                canAccept = true;
            } else {
                canAccept = false;
                return res.status(403).json({
                    error: "This broadcast is pending acceptance by another user"
                });
            }
        }

        res.json({
            success: true,
            canAccept,
            offer,
            broadcastSubState
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

    try {
        // Validate broadcast request
        const validation = await validateBroadcastRequest({ userId, offerId });
        if (!validation.valid) {
            return res.status(validation.statusCode).json({ error: validation.error });
        }

        const { offer, meeting } = validation;

            // Check if the offer is still open
        if (offer.offerState !== 'OPEN') {
            return {
                valid: false,
                error: "Offer is no longer available",
                statusCode: 403
            };
        }

        // Check broadcast state and update if needed
        const broadcastSubState = meeting.broadcastMetadata?.subState;

        if (broadcastSubState === 'UNCLAIMED') {
            return res.status(400).json({
                error: "This broadcast must be pending-claimed before it can be claimed."
            });
        } else if (broadcastSubState === 'PENDING_CLAIMED') {
            // Verify this user has the pending claim
            if (meeting.broadcastMetadata?.offerClaimedId !== offerId) {
                return res.status(403).json({
                    error: "This broadcast is pending acceptance by another user"
                });
            }

        } else if (broadcastSubState === 'CLAIMED') {
            return res.status(400).json({
                error: "This broadcast has already been claimed"
            });
        }

        // Use the existing acceptOffer logic
        await setBroadcastClaimed({meetingId: meeting.id, offerClaimedId: offer.id})
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

    try {
        // Validate broadcast request
        const validation = await validateBroadcastRequest({ userId, offerId });
        if (!validation.valid) {
            return res.status(validation.statusCode).json({ error: validation.error });
        }
        const { meeting, offer } = validation;

        // Reject the broadcast offer
        await setBroadcastUnclaimed({meetingId: meeting.id});
        const openOffer = await setOfferOpen({offerId})
        //const rejectedOffer = await rejectOffer({ offerId });


        res.json({
            success: true,
            offer: openOffer
        });
    } catch (error) {
        console.error("Error rejecting broadcast:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleIsUserBroadcasting = async (req: Request, res: Response) => {
    const { userId } = req.body;
    console.log("is user broadcasting --", { userId });

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const isBroadcasting = await getIsBroadcasting({ userId });
        res.json({ success: true, userId, isBroadcasting });
    } catch (error) {
        console.error("Error checking if user is broadcasting:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleCancelBroadcastAcceptance = async (req: Request, res: Response) => {
    const { userId, meetingId } = req.body;
    console.log("cancel broadcast acceptance --", { userId, meetingId });

    if (!userId || !meetingId) {
        return res.status(400).json({ error: "userId and meetingId are required" });
    }

    try {
        // Get the meeting
        const meeting = await getMeetingById({ meetingId });

        if (!meeting) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        // Verify it's a broadcast meeting
        if (meeting.meetingType !== 'BROADCAST') {
            return res.status(400).json({ error: "This operation is only valid for broadcast meetings" });
        }

        // Verify the user is the one who accepted
        if (meeting.acceptedUserId !== userId) {
            return res.status(403).json({ error: "You are not the user who accepted this broadcast" });
        }

        // Unclaim the broadcast - sets meeting back to SEARCHING, clears acceptedUserId, sets broadcast to UNCLAIMED
        const unclaimedMeeting = await unclaimBroadcastMeeting({ meetingId });

        res.json({
            success: true,
            meeting: unclaimedMeeting
        });
    } catch (error) {
        console.error("Error canceling broadcast acceptance:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
