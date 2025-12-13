import type { Request, Response } from 'express';
import { acceptOffer, getMeetingOffers, getOfferById, getOffersForUser, rejectOffer, rejectOfferWithMeeting, setOffersExpired } from '../backend/offer.js';
import { getMeetingById } from '../backend/query/meeting-lookup.js';
import { clearOutOffers, processOffersForMeeting } from '../backend/process-meeting.js';
import { setOfferRejected } from '../backend/update/offer-update.js';



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
    const offer = await getOfferById({offerId})
    if (!offer) {
      throw new Error("Cannot find offer")
    }
    const meetingId = offer.meetingId;
    const meeting = await getMeetingById({meetingId})
    if (!meeting) {
      throw new Error("Cannot find meeting to accept")
    }
    const acceptedOffer = await acceptOffer({userId, offerId});
    const offers = await getMeetingOffers({ meetingId });
    const otherOffers = offers.filter(o => o.id !== offerId);
    console.log("IN HANDLE ACCEPT OFFER __", offer);
    console.log("other offers ----- :))))", otherOffers);
    await setOffersExpired(otherOffers);
    //processOffersForMeeting()

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
    const rejectedOffer = await setOfferRejected({ offerId });
    res.json(rejectedOffer);
  } catch (error) {
    console.error("Error rejecting offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}