import type { MeetingState, Meeting } from '../types.js';
export declare const createMeeting: ({ userFromId, scheduledFor, scheduledEnd, title }: {
    userFromId: string;
    scheduledFor: Date;
    scheduledEnd: Date;
    title: string;
}) => Promise<Meeting>;
export declare const setMeetingState: ({ meetingId, meetingState }: {
    meetingId: string;
    meetingState: MeetingState;
}) => Promise<Meeting>;
export declare const setMeetingAccepted: ({ meetingId, userId }: {
    meetingId: string;
    userId: string;
}) => Promise<Meeting>;
export declare const deleteMeeting: ({ meetingId }: {
    meetingId: any;
}) => Promise<void>;
export declare const getCreatedMeetings: ({ userFromId }: {
    userFromId: string;
}) => Promise<Meeting[]>;
export declare const getAcceptedMeetings: ({ acceptedUserId }: {
    acceptedUserId: string;
}) => Promise<Meeting[]>;
export declare const getAllSearchingMeetings: () => Promise<Meeting[]>;
export declare const getUserFromMeeting: (meeting: Meeting) => Promise<User | null>;
//# sourceMappingURL=meeting.d.ts.map