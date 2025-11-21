
import type { MeetingState,  Meeting, User } from '../types.js';
import { prisma } from './auth.js';  
import { getMeetingOffers } from './offer.js';
import { clearOutOffers } from './process-meeting.js';


export const findBroadcastedMeetings = (meetings: Meeting[]): Meeting[] => {
    return meetings.filter(meeting => meeting.meetingType === 'BROADCAST');
}


export const deleteBroadcastedMeeting = async (meeting: Meeting) => {
    const offers = await getMeetingOffers({meetingId: meeting.id})
    await clearOutOffers(offers)
}