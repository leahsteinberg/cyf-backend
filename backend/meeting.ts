
import type { Meeting } from '../types.js';
import { getMeetingOffers } from './offer.js';
import { clearOutOffers } from './process-meeting.js';
import { deleteMeeting } from './update/meeting-update.js';


export const findBroadcastedMeetings = (meetings: Meeting[]): Meeting[] => {
    return meetings.filter(meeting => meeting.meetingType === 'BROADCAST');
}

export const deleteBroadcastedMeeting = async (meeting: Meeting) => {
    await deleteMeeting({meetingId: meeting.id});
    // const offers = await getMeetingOffers({meetingId: meeting.id})

    // deleteMeeting
    // await setOffersExpired(offers)
}
