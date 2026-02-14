
import { isBroadcastMeeting, type Meeting, type Offer } from '../types.js';
import { getMeetingOffers } from './offer.js';
import { getMeetingById } from './query/meeting-lookup.js';
import { getAcceptedOfferByMeetingId, getOffersForUser } from './query/offer-lookup.js';
import { deleteMeetingAndOffers, setMeetingOpen } from './update/meeting-update.js';
import { setOfferOpen } from './update/offer-update.js';


export const findBroadcastedMeetings = (meetings: Meeting[]): Meeting[] => {
    return meetings.filter(meeting => isBroadcastMeeting(meeting));
}

export const deleteBroadcastedMeeting = async (meeting: Meeting) => {
    await deleteMeetingAndOffers({meetingId: meeting.id});
    // const offers = await getMeetingOffers({meetingId: meeting.id})

    // deleteMeeting
    // await setOffersExpired(offers)
}


export const unacceptMeetingByAcceptor = async ({meetingId}: {meetingId: string}):Promise<Offer> => {

    const offer = await getAcceptedOfferByMeetingId({ meetingId });
    
    if (!offer) {
      throw new Error("No valid offer for user found.");
    }
    const reOpenedOffer = await setOfferOpen({offerId: offer.id});
    const offers = await getMeetingOffers({ meetingId });
    const otherOffers = offers.filter(o => o.id != reOpenedOffer.id);
    for (let otherOffer of otherOffers) {
        await setOfferOpen( {offerId: otherOffer.id});
    }
    const openMeeting = await setMeetingOpen({ meetingId })

  return reOpenedOffer;

}


export const getOfferedMeetings = async (userId: string): Promise<Meeting[]> =>
    {
        const offers = await getOffersForUser({userId});
        const meetingIds = offers.map((o: Offer) => o.meetingId);
        const meetingsOfferedPromises = meetingIds.map((meetingId: string) => getMeetingById({meetingId}));
        const meetings = await Promise.all(meetingsOfferedPromises);
        const filteredMeetings = meetings.filter((m) => !!m);
        if (!filteredMeetings) {
            return [];
        }
        return filteredMeetings;
    }
