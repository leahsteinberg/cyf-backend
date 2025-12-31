import type { Meeting, MeetingState, MeetingType, TimeType, TargetType, SourceType } from "../../types.js";
type CreateMeetingParams = {
    userFromId: string;
    scheduledFor: Date;
    scheduledEnd: Date;
    backupScheduledTimes?: Date[];
    title: string;
    meetingType?: MeetingType;
    timeType?: TimeType;
    targetType?: TargetType;
    sourceType?: SourceType;
    intentLabel?: string;
    targetUserIds?: string[];
    suggestionReason?: string;
    meetingState?: MeetingState;
    minParticipants?: number;
    maxParticipants?: number;
};
export declare const createMeeting: (params: CreateMeetingParams) => Promise<Meeting>;
export declare const setMeetingState: ({ meetingId, meetingState }: {
    meetingId: string;
    meetingState: MeetingState;
}) => Promise<Meeting>;
export declare const setMeetingAcceptors: ({ meetingId, userId }: {
    meetingId: string;
    userId: string;
}) => Promise<Meeting>;
export declare const setMeetingOpen: ({ meetingId }: {
    meetingId: string;
}) => Promise<Meeting>;
export declare const setMeetingDismissed: ({ meetingId }: {
    meetingId: string;
}) => Promise<Meeting>;
export declare const unclaimBroadcastMeeting: ({ meetingId }: {
    meetingId: string;
}) => Promise<Meeting>;
export declare const deleteMeetingAndOffers: ({ meetingId }: {
    meetingId: string;
}) => Promise<Meeting>;
export declare const updateMeetingState: (meeting: Meeting, toState: MeetingState, acceptedUserId?: string | null, scheduledFor?: Date, scheduledEnd?: Date) => Promise<void>;
export {};
//# sourceMappingURL=meeting-update.d.ts.map