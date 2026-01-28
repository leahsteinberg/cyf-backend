/**
 * Event type definitions for call tracking
 * These provide type safety for the metadata stored in UserEvent
 */
export type CallStartedMetadata = {
    meetingId: string;
    participantId?: string;
    callType?: 'video' | 'audio';
    timestamp: string;
};
export type CallEndedMetadata = {
    meetingId: string;
    participantId?: string;
    duration?: number;
    endReason?: 'completed' | 'error' | 'user_hangup' | 'timeout';
    timestamp: string;
};
export type CallErrorMetadata = {
    meetingId: string;
    participantId?: string;
    errorType: string;
    errorMessage?: string;
    timestamp: string;
};
/**
 * Log when a user starts a call
 */
export declare const logCallStarted: (userId: string, metadata: CallStartedMetadata) => Promise<{
    id: string;
    createdAt: Date;
    metadata: import("../../generated/prisma/runtime/library.js").JsonValue | null;
    userId: string;
    eventType: string;
} | null>;
/**
 * Log when a user ends a call
 */
export declare const logCallEnded: (userId: string, metadata: CallEndedMetadata) => Promise<{
    id: string;
    createdAt: Date;
    metadata: import("../../generated/prisma/runtime/library.js").JsonValue | null;
    userId: string;
    eventType: string;
} | null>;
/**
 * Log when a call encounters an error
 */
export declare const logCallError: (userId: string, metadata: CallErrorMetadata) => Promise<{
    id: string;
    createdAt: Date;
    metadata: import("../../generated/prisma/runtime/library.js").JsonValue | null;
    userId: string;
    eventType: string;
} | null>;
/**
 * Convenience function to log both start and end for testing
 */
export declare const logFullCall: (userId: string, { meetingId, participantId, callType, duration, endReason, }: {
    meetingId: string;
    participantId?: string;
    callType?: "video" | "audio";
    duration: number;
    endReason?: "completed" | "error" | "user_hangup" | "timeout";
}) => Promise<void>;
//# sourceMappingURL=call-tracking.d.ts.map