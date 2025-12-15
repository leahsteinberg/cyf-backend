import type { Request, Response } from 'express';
import { acceptOffer, getMeetingOffers, getOfferById, getOffersForUser, setOffersExpired } from '../backend/offer.js';
import { getMeetingById } from '../backend/query/meeting-lookup.js';
import { setOfferRejected } from '../backend/update/offer-update.js';
import { ACCEPTED_MEETING_STATE, ACCEPTED_OFFER_STATE, DRAFT_MEETING_STATE, OPEN_OFFER_STATE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE } from '../types.js';
import { setMeetingState } from '../backend/update/meeting-update.js';
import { transitionMeeting } from '../backend/transition-meeting.js';



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
    if (offer.offerState !== OPEN_OFFER_STATE ) {
      throw new Error("Cannot accept an offer that is not open")
    }
    const meetingId = offer.meetingId;
    await transitionMeeting({meetingId, toState: ACCEPTED_MEETING_STATE, actorId: userId})


    await acceptOffer({userId, offerId});
    const offers = await getMeetingOffers({ meetingId });
    const otherOffers = offers.filter(o => o.id !== offerId);
    await setOffersExpired(otherOffers);

    res.json(offers);
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({ error: `Internal server error attempting to accept meeting. Error: ${error}` });
  }

}

export const handleRejectOffer = async (req: Request, res: Response) => {
  const { userId, offerId } = req.body;
  console.log("in reject offer", { userId, offerId })
  if (!userId || !offerId) {
    return res.status(400).json({error: "userId and offerId are required to reject offer"})
  }

  try {
    const offer = await getOfferById({offerId})
    if (!offer) {
      throw new Error("Cannot find offer")
    }
    if (offer.offerState !== ACCEPTED_OFFER_STATE ) {
      throw new Error("Cannot reject an offer that is not open")
    }
    const meetingId = offer.meetingId;
    
    const rejectedOffer = await setOfferRejected({ offerId });
    const offers = await getMeetingOffers({meetingId});
    

    const openOffers = offers.filter(o => o.offerState === OPEN_OFFER_STATE);
    if (openOffers.length === 0) {
      const {meeting, events} = await transitionMeeting({meetingId, toState:REJECTED_MEETING_STATE, actorId: userId})

    }
    res.json(rejectedOffer);

  } catch (error) {
    console.error("Error rejecting offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}