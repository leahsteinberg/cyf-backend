import { getOffersForUser, acceptOffer } from "../backend/offer.js";

export const handleGetOffers = async (req, res) => {
  const { userId } = req.body;
  console.log("handle get offers ---", userId);
  
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

export const handleAcceptOffer = async (req, res) => {
  const { userId, offerId } = req.body;
  console.log("in accept offer", { userId, offerId })

  if (!userId || !offerId) {
    return res.status(400).json({error: "userId and offerId are required to accept offer"})
  }
  
  try {
    const offer = await acceptOffer({userId, offerId})

  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({ error: "Internal server error" });
  }

}

export const handleRejectOffer = async (req, res) => {
  const { userId, offerId } = req.body;
  console.log("in reject offer", { userId, offerId })
  if (!userId || !offerId) {
    return res.status(400).json({error: "userId and offerId are required to reject offer"})
  }
}