import { getOffersForUser, acceptOffer, rejectOffer, processRejectedOffer } from "../backend/offer.js";
import type { Request, Response } from 'express';



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
    const offer = await acceptOffer({userId, offerId})
    res.json(offer);
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
    await processRejectedOffer({ offerId });
    res.json(rejectedOffer);
  } catch (error) {
    console.error("Error rejecting offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}