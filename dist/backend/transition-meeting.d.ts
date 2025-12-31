import { type DomainEvent, type Meeting, type MeetingState } from "../types.js";
export declare const transitionMeeting: ({ meetingId, toState, actorId, scheduledFor, scheduledEnd }: {
    meetingId: string;
    toState: MeetingState;
    actorId: string;
    scheduledFor?: Date;
    scheduledEnd?: Date;
}) => Promise<{
    meeting: Meeting;
    events: DomainEvent[];
}>;
//# sourceMappingURL=transition-meeting.d.ts.map