
import type { Meeting, Offer } from '../types.js';
import { getEffectiveTimeType, getEffectiveTargetType, IMMEDIATE_TIME_TYPE, OPEN_TARGET_TYPE } from '../types.js';
import { getMeetingOffers, rejectOfferWithMeeting } from './offer.js';
import { clearOutOffers } from './process-meeting.js';
import { getAcceptedOfferByMeetingId } from './query/offer-lookup.js';
import { deleteMeeting, setMeetingOpen } from './update/meeting-update.js';
import { setOfferOpen, setOfferRejected } from './update/offer-update.js';


export const findBroadcastedMeetings = (meetings: Meeting[]): Meeting[] => {
    return meetings.filter(meeting => {
        const timeType = getEffectiveTimeType(meeting);
        const targetType = getEffectiveTargetType(meeting);
        return timeType === IMMEDIATE_TIME_TYPE && targetType === OPEN_TARGET_TYPE;
    });
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
    const reOpenedOffer = await setOfferOpen({offerId: offer.id});
    const offers = await getMeetingOffers({ meetingId });
    const otherOffers = offers.filter(o => o.id != reOpenedOffer.id);
    for (let otherOffer of otherOffers) {
        await setOfferOpen( {offerId: otherOffer.id});
    }
    const openMeeting = await setMeetingOpen({ meetingId })

  return reOpenedOffer;

}
