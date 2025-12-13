
import type { Meeting } from '../types.js';
import { getMeetingOffers, rejectOfferWithMeeting } from './offer.js';
import { clearOutOffers } from './process-meeting.js';
import { getAcceptedOfferByMeetingId } from './query/offer-lookup.js';
import { deleteMeeting } from './update/meeting-update.js';
import { setOfferOpen } from './update/offer-update.js';


export const findBroadcastedMeetings = (meetings: Meeting[]): Meeting[] => {
    return meetings.filter(meeting => meeting.meetingType === 'BROADCAST');
}

export const deleteBroadcastedMeeting = async (meeting: Meeting) => {
    await deleteMeeting({meetingId: meeting.id});
    // const offers = await getMeetingOffers({meetingId: meeting.id})

    // deleteMeeting
    // await setOffersExpired(offers)
}


export const deleteAcceptedMeetingByAcceptor = async ({meetingId}: {meetingId: string}):Promise<Offer> => {

    const offer = await getAcceptedOfferByMeetingId({ meetingId });
    
    if (!offer) {
      throw new Error("No valid offer for user found.");
    }
    const rejectedOffer = await rejectOfferWithMeeting({offerId: offer.id})
    //res.json(rejectedOffer);
    const offers = await getMeetingOffers({ meetingId });
    const otherOffers = offers.filter(o => o.id != rejectedOffer.id);
    for (let otherOffer of otherOffers) {
        await setOfferOpen( {offerId: otherOffer.id});
    }

  // first need to delete offers
  return rejectedOffer;
  //res.json(deletedMeeting);

}
