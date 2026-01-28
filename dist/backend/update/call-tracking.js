import { logEvent } from "./event-tracking.js";
/**
 * Log when a user starts a call
 */
export const logCallStarted = async (userId, metadata) => {
    return logEvent({
        userId,
        eventType: 'call_started',
        metadata,
    });
};
/**
 * Log when a user ends a call
 */
export const logCallEnded = async (userId, metadata) => {
    return logEvent({
        userId,
        eventType: 'call_ended',
        metadata,
    });
};
/**
 * Log when a call encounters an error
 */
export const logCallError = async (userId, metadata) => {
    return logEvent({
        userId,
        eventType: 'call_error',
        metadata,
    });
};
/**
 * Convenience function to log both start and end for testing
 */
export const logFullCall = async (userId, { meetingId, participantId, callType = 'video', duration, endReason = 'completed', }) => {
    const timestamp = new Date().toISOString();
    await logCallStarted(userId, {
        meetingId,
        participantId,
        callType,
        timestamp,
    });
    await logCallEnded(userId, {
        meetingId,
        participantId,
        duration,
        endReason,
        timestamp,
    });
};
//# sourceMappingURL=call-tracking.js.map