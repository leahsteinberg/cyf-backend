import { prisma } from "../auth.js";
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
export const logEvent = async ({ userId, eventType, metadata = {}, }) => {
    try {
        return await prisma.userEvent.create({
            data: {
                userId,
                eventType,
                metadata,
            },
        });
    }
    catch (error) {
        console.error('Error logging event:', { userId, eventType, error });
        // Don't throw - event logging should not break the main flow
        return null;
    }
};
/**
 * Get events for a specific user
 */
export const getUserEvents = async ({ userId, eventType, limit = 100, since, }) => {
    return prisma.userEvent.findMany({
        where: {
            userId,
            ...(eventType && { eventType }),
            ...(since && { createdAt: { gte: since } }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};
/**
 * Get event count for a user
 */
export const getUserEventCount = async ({ userId, eventType, since, }) => {
    return prisma.userEvent.count({
        where: {
            userId,
            ...(eventType && { eventType }),
            ...(since && { createdAt: { gte: since } }),
        },
    });
};
//# sourceMappingURL=event-tracking.js.map