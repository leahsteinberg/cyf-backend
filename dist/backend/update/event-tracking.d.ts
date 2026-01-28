/**
 * Generic event logging function.
 * Logs any user event with flexible metadata.
 *
 * @example
 * await logEvent({
 *   userId: '123',
 *   eventType: 'call_started',
 *   metadata: { meetingId: 'abc', callType: 'video' }
 * });
 */
export declare const logEvent: ({ userId, eventType, metadata, }: {
    userId: string;
    eventType: string;
    metadata?: Record<string, any>;
}) => Promise<{
    id: string;
    createdAt: Date;
    metadata: import("../../generated/prisma/runtime/library.js").JsonValue | null;
    userId: string;
    eventType: string;
} | null>;
/**
 * Get events for a specific user
 */
export declare const getUserEvents: ({ userId, eventType, limit, since, }: {
    userId: string;
    eventType?: string;
    limit?: number;
    since?: Date;
}) => Promise<{
    id: string;
    createdAt: Date;
    metadata: import("../../generated/prisma/runtime/library.js").JsonValue | null;
    userId: string;
    eventType: string;
}[]>;
/**
 * Get event count for a user
 */
export declare const getUserEventCount: ({ userId, eventType, since, }: {
    userId: string;
    eventType?: string;
    since?: Date;
}) => Promise<number>;
//# sourceMappingURL=event-tracking.d.ts.map