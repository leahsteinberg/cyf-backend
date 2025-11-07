import type { Meeting } from '../types.js';
export declare const processOfferForNewMeeting: (meeting: Meeting) => Promise<Meeting>;
export declare const makeOfferForNewMeeting: ({ meeting, userOfferedId }: {
    meeting: Meeting;
    userOfferedId: string;
}) => Promise<Meeting>;
export declare const processOffersForMeeting: (meeting: Meeting) => Promise<Meeting>;
//# sourceMappingURL=process-meeting.d.ts.map