
export type OfferState = "OPEN" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type MeetingState = "DRAFT" | "SEARCHING" | "ACCEPTED" | "REJECTED" | "PAST" | "EXPIRED" | "DISMISSED";
export type MeetingType = "ADVANCE" | "BROADCAST";
export type BroadcastSubState = "PENDING_CLAIMED" | "UNCLAIMED" | "CLAIMED";

// NEW TYPES - Phase 1 Migration
export type TimeType = "IMMEDIATE" | "FUTURE" | "UNKNOWN";
export type TargetType = "OPEN" | "FRIEND_SPECIFIC" | "GROUP";
export type SourceType = "USER_INTENT" | "SYSTEM_PATTERN" | "SYSTEM_REAL_TIME";

export const OPEN_OFFER_STATE_TYPE = 'OPEN';
export const ACCEPTED_OFFER_STATE_TYPE = 'ACCEPTED';
export const REJECTED_OFFER_STATE_TYPE = 'REJECTED';
export const EXPIRED_OFFER_STATE_TYPE = 'EXPIRED';

export const DRAFT_MEETING_STATE_TYPE = 'DRAFT';
export const SEARCHING_MEETING_STATE_TYPE = 'SEARCHING';
export const ACCEPTED_MEETING_STATE_TYPE = 'ACCEPTED';
export const REJECTED_MEETING_STATE_TYPE = 'REJECTED';
export const PAST_MEETING_STATE_TYPE = 'PAST';


export const IMMEDIATE_TIME_TYPE = 'IMMEDIATE';
export const FUTURE_TIME_TYPE = 'FUTURE';
export const UNKNOWN_TIME_TYPE = 'UNKNOWN';

export const OPEN_TARGET_TYPE = 'OPEN';
export const FRIEND_SPECIFIC_TARGET_TYPE = 'FRIEND_SPECIFIC';
export const GROUP_TARGET_TYPE = 'GROUP';

export const USER_INTENT_SOURCE_TYPE = 'USER_INTENT';
export const SYSTEM_PATTERN_SOURCE_TYPE = 'SYSTEM_PATTERN';
export const SYSTEM_REAL_TIME_SOURCE_TYPE = 'SYSTEM_REAL_TIME';








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
    createdAt: Date;
    acceptedUserId: string | null;
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
    targetUserId?: string | null;

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