import type { Request, Response } from 'express';
import { acceptOffer, getMeetingOffers, getOfferById, getOffersForUser } from '../backend/offer.js';
import { getMeetingById } from '../backend/query/meeting-lookup.js';
import { setOfferRejected } from '../backend/update/offer-update.js';
import { ACCEPTED_OFFER_STATE, isBroadcastMeeting, OPEN_OFFER_STATE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE } from '../types.js';
import { setMeetingState } from '../backend/update/meeting-update.js';
import { transitionMeeting } from '../backend/transition-meeting.js';



export const handleGetOffers = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const offers = await getOffersForUser({ userId });

    // Filter out duplicate broadcast offers from the same user, keeping only the newest
    // This applies to ALL broadcasts (IMMEDIATE), not just OPEN broadcasts
    const seenBroadcastUsers = new Set<string>();
    const filteredOffers = offers.filter(offer => {
      const meeting = (offer as any).meeting;
      if (!meeting) return true;

      if (isBroadcastMeeting(meeting)) {
        const userFromId = meeting.userFromId;
        if (seenBroadcastUsers.has(userFromId)) {
          return false; // Filter out duplicate
        }
        seenBroadcastUsers.add(userFromId);
      }

      return true;
    });

    res.json(filteredOffers);
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

    // acceptOffer now handles state transitions and expiring offers based on participant counts
    const acceptedOffer = await acceptOffer({userId, offerId});

    res.json(acceptedOffer);
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
    if (offer.offerState !== OPEN_OFFER_STATE ) {
      throw new Error("Cannot reject an offer that is not open.")
    }
    const meetingId = offer.meetingId;
    const meeting = await getMeetingById({meetingId});
    if (meeting?.meetingState !== SEARCHING_MEETING_STATE) {
      throw new Error("Cannot reject an offer that is not open.")
    }
    
    const rejectedOffer = await setOfferRejected({ offerId });
    const offers = await getMeetingOffers({meetingId});
    

    const openOffers = offers.filter(o => o.offerState === OPEN_OFFER_STATE);
    // Only transition to REJECTED if:
    // - No open offers remain AND
    // - Not enough acceptances to meet minParticipants
    if (openOffers.length === 0) {
      const meeting = await getMeetingById({meetingId});
      if (meeting && meeting.acceptedUserIds.length < meeting.minParticipants) {
        await transitionMeeting({meetingId, toState: REJECTED_MEETING_STATE, actorId: userId});
      }
    }
    res.json(rejectedOffer);

  } catch (error) {
    console.error("Error rejecting offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}