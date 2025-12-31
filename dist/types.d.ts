export type OfferState = "OPEN" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type MeetingState = "DRAFT" | "SEARCHING" | "ACCEPTED" | "REJECTED" | "PAST" | "EXPIRED" | "DISMISSED_DRAFT" | "CANCELED";
export type MeetingType = "ADVANCE" | "BROADCAST";
export type BroadcastSubState = "PENDING_CLAIMED" | "UNCLAIMED" | "CLAIMED";
export type TimeType = "IMMEDIATE" | "FUTURE" | "UNKNOWN";
export type TargetType = "OPEN" | "FRIEND_SPECIFIC" | "GROUP";
export type SourceType = "USER_INTENT" | "SYSTEM_PATTERN" | "SYSTEM_REAL_TIME";
export type SignalType = "WALK_PATTERN" | "CALL_INTENT" | "TIME_OF_DAY_PREFERENCE" | "WORK_HOURS";
export type MeetingActorRole = "INITIATOR" | "ACCEPTOR" | "SPECIFIC_TARGET" | "OPEN_TARGET" | "SYSTEM";
export declare const OPEN_OFFER_STATE: OfferState;
export declare const ACCEPTED_OFFER_STATE: OfferState;
export declare const REJECTED_OFFER_STATE: OfferState;
export declare const EXPIRED_OFFER_STATE: OfferState;
export declare const DRAFT_MEETING_STATE: MeetingState;
export declare const SEARCHING_MEETING_STATE: MeetingState;
export declare const ACCEPTED_MEETING_STATE: MeetingState;
export declare const REJECTED_MEETING_STATE: MeetingState;
export declare const PAST_MEETING_STATE: MeetingState;
export declare const DISMISSED_DRAFT_MEETING_STATE: MeetingState;
export declare const EXPIRED_MEETING_STATE: MeetingState;
export declare const CANCELED_MEETING_STATE: MeetingState;
export declare const IMMEDIATE_TIME_TYPE: TimeType;
export declare const FUTURE_TIME_TYPE: TimeType;
export declare const UNKNOWN_TIME_TYPE: TimeType;
export declare const OPEN_TARGET_TYPE: TargetType;
export declare const FRIEND_SPECIFIC_TARGET_TYPE: TargetType;
export declare const GROUP_TARGET_TYPE: TargetType;
export declare const USER_INTENT_SOURCE_TYPE: SourceType;
export declare const SYSTEM_PATTERN_SOURCE_TYPE: SourceType;
export declare const SYSTEM_REAL_TIME_SOURCE_TYPE: SourceType;
export declare const PENDING_CLAIMED_BROADCAST_STATE: BroadcastSubState;
export declare const UNCLAIMED_BROADCAST_STATE: BroadcastSubState;
export declare const CLAIMED_BROADCAST_STATE: BroadcastSubState;
export declare const INITIATOR_ACTOR_ROLE: MeetingActorRole;
export declare const ACCEPTOR_ACTOR_ROLE: MeetingActorRole;
export declare const SPECIFIC_TARGET_ACTOR_ROLE: MeetingActorRole;
export declare const OPEN_TARGET_ACTOR_ROLE: MeetingActorRole;
export declare const SYSTEM_ACTOR_ROLE: MeetingActorRole;
export declare const WALK_PATTERN_SIGNAL_TYPE: SignalType;
export declare const CALL_INTENT_SIGNAL_TYPE: SignalType;
export declare const TIME_OF_DAY_PREFERENCE_SIGNAL_TYPE: SignalType;
export declare const WORK_HOURS_SIGNAL_TYPE: SignalType;
export type DomainEvent = {
    type: 'MEETING_SUGGESTED';
    meetingId: string;
} | {
    type: 'MEETING_SEARCHING_STARTED';
    meetingId: string;
} | {
    type: 'MEETING_ACCEPTED';
    meetingId: string;
    acceptedUserId: string;
} | {
    type: 'MEETING_REJECTED';
    meetingId: string;
} | {
    type: 'MEETING_CANCELLED';
    meetingId: string;
} | {
    type: 'MEETING_EXPIRED';
    meetingId: string;
} | {
    type: 'MEETING_PAST';
    meetingId: string;
};
export interface BaseEntity {
    id: string;
}
export interface User extends BaseEntity {
    name: string | null;
    email: string;
    username: string | null;
    displayUsername: string | null;
}
export interface BroadcastMetadata extends BaseEntity {
    meetingId: string;
    subState: BroadcastSubState;
    pendingAt: Date | null;
    offerClaimedId: string | null;
}
export interface Meeting extends BaseEntity {
    userFromId: string;
    scheduledFor: Date;
    scheduledEnd: Date;
    backupScheduledTimes: Date[];
    createdAt: Date;
    acceptedUserId: string | null;
    acceptedUserIds: string[];
    meetingState: MeetingState;
    userFrom?: User;
    acceptedUser?: User | null;
    title: string | null;
    meetingType: MeetingType;
    timeType?: TimeType | null;
    targetType?: TargetType | null;
    sourceType?: SourceType | null;
    intentLabel?: string | null;
    targetUserIds: string[];
    suggestionReason?: string | null;
    minParticipants: number;
    maxParticipants: number;
    broadcastMetadata?: BroadcastMetadata | null;
}
export interface Offer extends BaseEntity {
    meetingId: string;
    userOfferedId: string;
    createdAt: Date;
    offerState: OfferState;
    expiresAt: Date;
}
export interface Friendship extends BaseEntity {
    userId1: string;
    userId2: string;
}
type WalkPatternPayload = {};
type CallIntentPayload = {
    targetUserIds: string[];
};
type TimeOfDayPreferencePayload = {};
type WorkHoursPayload = {};
export type SignalPayloadMap = {
    WALK_PATTERN: WalkPatternPayload;
    CALL_INTENT: CallIntentPayload;
    TIME_OF_DAY_PREFERENCE: TimeOfDayPreferencePayload;
    WORK_HOURS: WorkHoursPayload;
};
export interface UserSignal<T extends SignalType> extends BaseEntity {
    userId: string;
    type: T;
    payload: SignalPayloadMap[];
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date | null;
}
/**
 * Maps old MeetingType to new flexible types
 * Used during dual-write to derive new fields from old
 */
export declare function meetingTypeToNew(meetingType: MeetingType): {
    timeType: TimeType;
    targetType: TargetType;
};
/**
 * Maps new flexible types back to old MeetingType
 * Used during dual-write to derive old field from new
 * Note: Some new combinations can't be represented in old system
 */
export declare function newToMeetingType(timeType: TimeType, targetType: TargetType): MeetingType;
/**
 * Type guard to check if a meeting has new fields populated
 * Useful for conditional logic during migration
 */
export declare function hasNewFields(meeting: Meeting): meeting is Meeting & {
    timeType: TimeType;
    targetType: TargetType;
};
/**
 * Gets effective TimeType for a meeting, with fallback to old system
 * Use this in business logic to support both old and new meetings
 */
export declare function getEffectiveTimeType(meeting: Meeting): TimeType;
/**
 * Gets effective TargetType for a meeting, with fallback to old system
 * Use this in business logic to support both old and new meetings
 */
export declare function getEffectiveTargetType(meeting: Meeting): TargetType;
/**
 * Checks if a meeting is a broadcast (IMMEDIATE time, any target type)
 * A broadcast is defined by being IMMEDIATE (happening now), not by who it targets
 * - IMMEDIATE + OPEN = broadcast to all friends
 * - IMMEDIATE + FRIEND_SPECIFIC = broadcast to specific friend(s)
 * - IMMEDIATE + GROUP = broadcast to a group
 */
export declare function isBroadcastMeeting(meeting: Meeting): boolean;
/**
 * Checks if a meeting is an OPEN broadcast (broadcast to all friends)
 * This is the legacy/traditional broadcast behavior
 */
export declare function isOpenBroadcast(meeting: Meeting): boolean;
export {};
//# sourceMappingURL=types.d.ts.map