export declare function buildSuggestionContext(userId: string): Promise<{
    user: {
        id: string;
        name: string | null;
        email: string;
        username: string | null;
        displayUsername: string | null;
        timezone: string | null;
        isBroadcasting: boolean;
        memberSince: Date;
    };
    signals: {
        callIntents: {
            id: string;
            payload: import("../types.js").SignalPayloadMap[];
            createdAt: Date | null;
        }[];
        walkPatterns: {
            id: string;
            payload: import("../types.js").SignalPayloadMap[];
            createdAt: Date | null;
        }[];
        timeOfDayPreferences: {
            id: string;
            payload: import("../types.js").SignalPayloadMap[];
            createdAt: Date | null;
        }[];
        workHours: {
            id: string;
            payload: import("../types.js").SignalPayloadMap[];
            createdAt: Date | null;
        }[];
    };
    friends: (import("../types.js").User & {
        isBroadcastingToMe: boolean;
    })[];
    recentMeetings: {
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
}>;
//# sourceMappingURL=signal-context.d.ts.map