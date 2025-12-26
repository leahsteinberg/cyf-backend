export type OfferState = "OPEN" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type MeetingState = "DRAFT" | "SEARCHING" | "ACCEPTED" | "REJECTED" | "PAST" | "EXPIRED" | "DISMISSED_DRAFT" | "CANCELED";
export type MeetingType = "ADVANCE" | "BROADCAST";
export type BroadcastSubState = "PENDING_CLAIMED" | "UNCLAIMED" | "CLAIMED";

// NEW TYPES - Phase 1 Migration
export type TimeType = "IMMEDIATE" | "FUTURE" | "UNKNOWN";
export type TargetType = "OPEN" | "FRIEND_SPECIFIC" | "GROUP";
export type SourceType = "USER_INTENT" | "SYSTEM_PATTERN" | "SYSTEM_REAL_TIME";
export type SignalType = "WALK_PATTERN" | "CALL_INTENT" | "TIME_OF_DAY_PREFERENCE" | "WORK_HOURS";

// HELPER TYPE 
export type MeetingActorRole = "INITIATOR" | "ACCEPTOR" | "SPECIFIC_TARGET" | "OPEN_TARGET" | "SYSTEM";

// Offer State Constants (type-safe with assertions)
export const OPEN_OFFER_STATE: OfferState = 'OPEN' as const;
export const ACCEPTED_OFFER_STATE: OfferState = 'ACCEPTED' as const;
export const REJECTED_OFFER_STATE: OfferState = 'REJECTED' as const;
export const EXPIRED_OFFER_STATE: OfferState = 'EXPIRED' as const;

// Meeting State Constants (type-safe with assertions)
export const DRAFT_MEETING_STATE: MeetingState = 'DRAFT' as const;
export const SEARCHING_MEETING_STATE: MeetingState = 'SEARCHING' as const;
export const ACCEPTED_MEETING_STATE: MeetingState = 'ACCEPTED' as const;
export const REJECTED_MEETING_STATE: MeetingState = 'REJECTED' as const;
export const PAST_MEETING_STATE: MeetingState = 'PAST' as const;
export const DISMISSED_DRAFT_MEETING_STATE: MeetingState = 'DISMISSED_DRAFT' as const;
export const EXPIRED_MEETING_STATE: MeetingState = 'EXPIRED' as const;
export const CANCELED_MEETING_STATE: MeetingState = 'CANCELED' as const;


// Time Type Constants (type-safe with assertions)
export const IMMEDIATE_TIME_TYPE: TimeType = 'IMMEDIATE' as const;
export const FUTURE_TIME_TYPE: TimeType = 'FUTURE' as const;
export const UNKNOWN_TIME_TYPE: TimeType = 'UNKNOWN' as const;

// Target Type Constants (type-safe with assertions)
export const OPEN_TARGET_TYPE: TargetType = 'OPEN' as const;
export const FRIEND_SPECIFIC_TARGET_TYPE: TargetType = 'FRIEND_SPECIFIC' as const;
export const GROUP_TARGET_TYPE: TargetType = 'GROUP' as const;

// Source Type Constants (type-safe with assertions)
export const USER_INTENT_SOURCE_TYPE: SourceType = 'USER_INTENT' as const;
export const SYSTEM_PATTERN_SOURCE_TYPE: SourceType = 'SYSTEM_PATTERN' as const;
export const SYSTEM_REAL_TIME_SOURCE_TYPE: SourceType = 'SYSTEM_REAL_TIME' as const;

// Broadcast Sub-State Constants (type-safe with assertions)
export const PENDING_CLAIMED_BROADCAST_STATE: BroadcastSubState = 'PENDING_CLAIMED' as const;
export const UNCLAIMED_BROADCAST_STATE: BroadcastSubState = 'UNCLAIMED' as const;
export const CLAIMED_BROADCAST_STATE: BroadcastSubState = 'CLAIMED' as const;

export const INITIATOR_ACTOR_ROLE: MeetingActorRole = "INITIATOR" as const;
export const ACCEPTOR_ACTOR_ROLE: MeetingActorRole = "ACCEPTOR" as const;
export const SPECIFIC_TARGET_ACTOR_ROLE: MeetingActorRole = "SPECIFIC_TARGET" as const;
export const OPEN_TARGET_ACTOR_ROLE: MeetingActorRole = "OPEN_TARGET" as const;
export const SYSTEM_ACTOR_ROLE: MeetingActorRole = "SYSTEM" as const;

export const WALK_PATTERN_SIGNAL_TYPE: SignalType = "WALK_PATTERN" as const;
export const CALL_INTENT_SIGNAL_TYPE: SignalType = "CALL_INTENT" as const;
export const TIME_OF_DAY_PREFERENCE_SIGNAL_TYPE: SignalType = "TIME_OF_DAY_PREFERENCE" as const;
export const WORK_HOURS_SIGNAL_TYPE: SignalType = "WORK_HOURS" as const;

export type DomainEvent =
  | { type: 'MEETING_SUGGESTED'; meetingId: string }
  | { type: 'MEETING_SEARCHING_STARTED'; meetingId: string }
  | { type: 'MEETING_ACCEPTED'; meetingId: string; acceptedUserId: string }
  | { type: 'MEETING_REJECTED'; meetingId: string }
  | { type: 'MEETING_CANCELLED'; meetingId: string }
  | { type: 'MEETING_EXPIRED'; meetingId: string }
  | { type: 'MEETING_PAST'; meetingId: string }

export interface BaseEntity {
    id: string;
};

export interface User extends BaseEntity {
    name: string | null;
    email: string;
    username: string | null;
    displayUsername: string | null;
}

export interface BroadcastMetadata extends BaseEntity {
    meetingId: string;
    subState: BroadcastSubState;
    pendingAt: Date | null,
    offerClaimedId: string | null,
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

    // OLD FIELD - Keep for backwards compatibility
    meetingType: MeetingType;

    // NEW FIELDS - Nullable during migration
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
    userId1 : string;
    userId2: string;
}

type WalkPatternPayload = {};

type CallIntentPayload = {
    targetUserIds: string[];
};

// TODO: Define the structure for time of day preferences
// Should include preferred times for calls (e.g., morning, afternoon, evening)
// Possible fields: preferredTimeRanges, dayOfWeek, etc.
type TimeOfDayPreferencePayload = {
    // Example structure:
    // preferredStartHour?: number; // 0-23
    // preferredEndHour?: number;   // 0-23
    // dayOfWeek?: string;          // "MONDAY", "TUESDAY", etc.
};

// TODO: Define the structure for work hours when user cannot have calls
// Should include work schedule blocking times
// Possible fields: workStartTime, workEndTime, daysOfWeek, etc.
type WorkHoursPayload = {
    // Example structure:
    // startHour: number;    // 0-23
    // endHour: number;      // 0-23
    // daysOfWeek?: string[]; // ["MONDAY", "TUESDAY", ...]
};

export type SignalPayloadMap = {
    WALK_PATTERN: WalkPatternPayload;
    CALL_INTENT: CallIntentPayload;
    TIME_OF_DAY_PREFERENCE: TimeOfDayPreferencePayload;
    WORK_HOURS: WorkHoursPayload;
}

export interface UserSignal<T extends SignalType> extends BaseEntity {
    userId: string;
    type: T;
    payload: SignalPayloadMap[];
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date | null;
  }

// ============================================================================
// MIGRATION HELPERS - Phase 1
// Helper functions to map between old MeetingType and new TimeType/TargetType
// ============================================================================

/**
 * Maps old MeetingType to new flexible types
 * Used during dual-write to derive new fields from old
 */
export function meetingTypeToNew(meetingType: MeetingType): {
    timeType: TimeType;
    targetType: TargetType;
} {
    switch (meetingType) {
        case 'ADVANCE':
            return { timeType: 'FUTURE', targetType: 'OPEN' };
        case 'BROADCAST':
            return { timeType: 'IMMEDIATE', targetType: 'OPEN' };
        default:
            // This should never happen with TypeScript, but safe fallback
            throw new Error(`Unknown meeting type: ${meetingType}`);
    }
}

/**
 * Maps new flexible types back to old MeetingType
 * Used during dual-write to derive old field from new
 * Note: Some new combinations can't be represented in old system
 */
export function newToMeetingType(timeType: TimeType, targetType: TargetType): MeetingType {
    // IMMEDIATE + OPEN = BROADCAST
    if (timeType === 'IMMEDIATE' && targetType === 'OPEN') {
        return 'BROADCAST';
    }

    // FUTURE + OPEN = ADVANCE
    if (timeType === 'FUTURE' && targetType === 'OPEN') {
        return 'ADVANCE';
    }

    // New combinations that don't exist in old system:
    // - FRIEND_SPECIFIC (new capability)
    // - UNKNOWN time (new capability)
    // - GROUP (future)
    // Default to ADVANCE for backwards compatibility
    return 'ADVANCE';
}

/**
 * Type guard to check if a meeting has new fields populated
 * Useful for conditional logic during migration
 */
export function hasNewFields(meeting: Meeting): meeting is Meeting & {
    timeType: TimeType;
    targetType: TargetType;
} {
    return meeting.timeType !== null &&
           meeting.timeType !== undefined &&
           meeting.targetType !== null &&
           meeting.targetType !== undefined;
}

/**
 * Gets effective TimeType for a meeting, with fallback to old system
 * Use this in business logic to support both old and new meetings
 */
export function getEffectiveTimeType(meeting: Meeting): TimeType {
    if (meeting.timeType) {
        return meeting.timeType;
    }

    // Fallback: derive from old meetingType
    return meetingTypeToNew(meeting.meetingType).timeType;
}

/**
 * Gets effective TargetType for a meeting, with fallback to old system
 * Use this in business logic to support both old and new meetings
 */
export function getEffectiveTargetType(meeting: Meeting): TargetType {
    if (meeting.targetType) {
        return meeting.targetType;
    }

    // Fallback: derive from old meetingType
    return meetingTypeToNew(meeting.meetingType).targetType;
}

/**
 * Checks if a meeting is a broadcast (IMMEDIATE time, any target type)
 * A broadcast is defined by being IMMEDIATE (happening now), not by who it targets
 * - IMMEDIATE + OPEN = broadcast to all friends
 * - IMMEDIATE + FRIEND_SPECIFIC = broadcast to specific friend(s)
 * - IMMEDIATE + GROUP = broadcast to a group
 */
export function isBroadcastMeeting(meeting: Meeting): boolean {
    return getEffectiveTimeType(meeting) === IMMEDIATE_TIME_TYPE;
}

/**
 * Checks if a meeting is an OPEN broadcast (broadcast to all friends)
 * This is the legacy/traditional broadcast behavior
 */
export function isOpenBroadcast(meeting: Meeting): boolean {
    return getEffectiveTimeType(meeting) === IMMEDIATE_TIME_TYPE &&
           getEffectiveTargetType(meeting) === OPEN_TARGET_TYPE;
}