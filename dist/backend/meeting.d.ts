import type { Meeting, Offer } from '../types.js';
export declare const findBroadcastedMeetings: (meetings: Meeting[]) => Meeting[];
export declare const deleteBroadcastedMeeting: (meeting: Meeting) => Promise<void>;
export declare const unacceptMeetingByAcceptor: ({ meetingId }: {
    meetingId: string;
}) => Promise<Offer>;
export declare const getOfferedMeetings: (userId: string) => Promise<Meeting[]>;
//# sourceMappingURL=meeting.d.ts.map