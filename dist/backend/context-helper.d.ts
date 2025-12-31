import type { Meeting, UserSignal, SignalType } from "../types.js";
export declare function buildCallIntentContext(signals: UserSignal<SignalType>[]): {
    id: string;
    payload: import("../types.js").SignalPayloadMap[];
    createdAt: Date | null;
}[];
export declare function buildWalkPatternContext(signals: UserSignal<SignalType>[]): {
    id: string;
    payload: import("../types.js").SignalPayloadMap[];
    createdAt: Date | null;
}[];
export declare function buildTimeOfDayPreferenceContext(signals: UserSignal<SignalType>[]): {
    id: string;
    payload: import("../types.js").SignalPayloadMap[];
    createdAt: Date | null;
}[];
export declare function buildWorkHoursContext(signals: UserSignal<SignalType>[]): {
    id: string;
    payload: import("../types.js").SignalPayloadMap[];
    createdAt: Date | null;
}[];
export declare function buildRecentMeetingsContext(createdMeetings: Meeting[], acceptedMeetings: Meeting[], daysBack?: number): {
    total: number;
    meetings: ({
        id: string;
        title: string | null;
        scheduledFor: Date;
        scheduledEnd: Date;
        meetingState: import("../types.js").MeetingState;
        timeType: import("../types.js").TimeType | null | undefined;
        targetType: import("../types.js").TargetType | null | undefined;
        sourceType: import("../types.js").SourceType | null | undefined;
        intentLabel: string | null | undefined;
        targetUserIds: string[];
        acceptedUserId: string | null;
        createdAt: Date;
        role: "creator";
    } | {
        id: string;
        title: string | null;
        scheduledFor: Date;
        scheduledEnd: Date;
        meetingState: import("../types.js").MeetingState;
        timeType: import("../types.js").TimeType | null | undefined;
        targetType: import("../types.js").TargetType | null | undefined;
        sourceType: import("../types.js").SourceType | null | undefined;
        intentLabel: string | null | undefined;
        targetUserIds: string[];
        createdByUserId: string;
        createdAt: Date;
        role: "acceptor";
    })[];
};
//# sourceMappingURL=context-helper.d.ts.map