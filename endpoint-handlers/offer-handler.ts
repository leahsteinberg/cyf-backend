import type { Request, Response } from 'express';
import { acceptOffer, getOffersForUser, rejectOffer } from '../backend/offer.js';
import { getMeetingById } from '../backend/query/meeting-lookup.js';
import { processOffersForMeeting } from '../backend/process-meeting.js';



export const handleGetOffers = async (req: Request, res: Response) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  try {
    const offers = await getOffersForUser({ userId });
    res.json(offers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleAcceptOffer = async (req: Request, res: Response) => {
  const { userId, offerId } = req.body;
  console.log("in accept offer", { userId, offerId })

  if (!userId || !offerId) {
    return res.status(400).json({error: "userId and offerId are required to accept offer"})
  }

  try {
    const offer = await acceptOffer({userId, offerId});
    const offers = await getOffersForUser({ userId });

    res.json(offers);
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }

}

export const handleRejectOffer = async (req: Request, res: Response) => {
  const { userId, offerId } = req.body;
  console.log("in reject offer", { userId, offerId })
  if (!userId || !offerId) {
    return res.status(400).json({error: "userId and offerId are required to reject offer"})
  }

  try {
    const rejectedOffer = await rejectOffer({ offerId });
    console.log("rejected offer -", rejectOffer)
    if (!rejectedOffer) {
        throw new Error('Rejected offer not found');
    }

    const meetingId = rejectedOffer.meetingId;

    // Get the meeting
    const meeting = await getMeetingById({ meetingId });
    if (meeting) {
      const newMeeting = await processOffersForMeeting(meeting)

    

    //await processRejectedOffer({ offerId });
    //const offers = await getOffersForUser({ userId });
    console.log("New offer,", offer);
    res.json(offer);
  } catch (error) {
    console.error("Error rejecting offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}