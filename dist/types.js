// Offer State Constants (type-safe with assertions)
export const OPEN_OFFER_STATE = 'OPEN';
export const ACCEPTED_OFFER_STATE = 'ACCEPTED';
export const REJECTED_OFFER_STATE = 'REJECTED';
export const EXPIRED_OFFER_STATE = 'EXPIRED';
// Meeting State Constants (type-safe with assertions)
export const DRAFT_MEETING_STATE = 'DRAFT';
export const SEARCHING_MEETING_STATE = 'SEARCHING';
export const ACCEPTED_MEETING_STATE = 'ACCEPTED';
export const REJECTED_MEETING_STATE = 'REJECTED';
export const PAST_MEETING_STATE = 'PAST';
export const DISMISSED_DRAFT_MEETING_STATE = 'DISMISSED_DRAFT';
export const EXPIRED_MEETING_STATE = 'EXPIRED';
export const CANCELED_MEETING_STATE = 'CANCELED';
// Time Type Constants (type-safe with assertions)
export const IMMEDIATE_TIME_TYPE = 'IMMEDIATE';
export const FUTURE_TIME_TYPE = 'FUTURE';
export const UNKNOWN_TIME_TYPE = 'UNKNOWN';
// Target Type Constants (type-safe with assertions)
export const OPEN_TARGET_TYPE = 'OPEN';
export const FRIEND_SPECIFIC_TARGET_TYPE = 'FRIEND_SPECIFIC';
export const GROUP_TARGET_TYPE = 'GROUP';
// Source Type Constants (type-safe with assertions)
export const USER_INTENT_SOURCE_TYPE = 'USER_INTENT';
export const SYSTEM_PATTERN_SOURCE_TYPE = 'SYSTEM_PATTERN';
export const SYSTEM_REAL_TIME_SOURCE_TYPE = 'SYSTEM_REAL_TIME';
// Broadcast Sub-State Constants (type-safe with assertions)
export const PENDING_CLAIMED_BROADCAST_STATE = 'PENDING_CLAIMED';
export const UNCLAIMED_BROADCAST_STATE = 'UNCLAIMED';
export const CLAIMED_BROADCAST_STATE = 'CLAIMED';
export const INITIATOR_ACTOR_ROLE = "INITIATOR";
export const ACCEPTOR_ACTOR_ROLE = "ACCEPTOR";
export const SPECIFIC_TARGET_ACTOR_ROLE = "SPECIFIC_TARGET";
export const OPEN_TARGET_ACTOR_ROLE = "OPEN_TARGET";
export const SYSTEM_ACTOR_ROLE = "SYSTEM";
export const WALK_PATTERN_SIGNAL_TYPE = "WALK_PATTERN";
export const CALL_INTENT_SIGNAL_TYPE = "CALL_INTENT";
export const TIME_OF_DAY_PREFERENCE_SIGNAL_TYPE = "TIME_OF_DAY_PREFERENCE";
export const WORK_HOURS_SIGNAL_TYPE = "WORK_HOURS";
;
// ============================================================================
// MIGRATION HELPERS - Phase 1
// Helper functions to map between old MeetingType and new TimeType/TargetType
// ============================================================================
/**
 * Maps old MeetingType to new flexible types
 * Used during dual-write to derive new fields from old
 */
export function meetingTypeToNew(meetingType) {
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
export function newToMeetingType(timeType, targetType) {
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
export function hasNewFields(meeting) {
    return meeting.timeType !== null &&
        meeting.timeType !== undefined &&
        meeting.targetType !== null &&
        meeting.targetType !== undefined;
}
/**
 * Gets effective TimeType for a meeting, with fallback to old system
 * Use this in business logic to support both old and new meetings
 */
export function getEffectiveTimeType(meeting) {
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
export function getEffectiveTargetType(meeting) {
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
export function isBroadcastMeeting(meeting) {
    return getEffectiveTimeType(meeting) === IMMEDIATE_TIME_TYPE;
}
/**
 * Checks if a meeting is an OPEN broadcast (broadcast to all friends)
 * This is the legacy/traditional broadcast behavior
 */
export function isOpenBroadcast(meeting) {
    return getEffectiveTimeType(meeting) === IMMEDIATE_TIME_TYPE &&
        getEffectiveTargetType(meeting) === OPEN_TARGET_TYPE;
}
//# sourceMappingURL=types.js.map