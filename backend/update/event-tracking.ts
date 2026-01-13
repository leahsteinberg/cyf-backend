import { prisma } from "../prisma-client.js";

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
export const logEvent = async ({
  userId,
  eventType,
  metadata = {},
}: {
  userId: string;
  eventType: string;
  metadata?: Record<string, any>;
}) => {
  try {
    return await prisma.userEvent.create({
      data: {
        userId,
        eventType,
        metadata,
      },
    });
  } catch (error) {
    console.error('Error logging event:', { userId, eventType, error });
    // Don't throw - event logging should not break the main flow
    return null;
  }
};

/**
 * Get events for a specific user
 */
export const getUserEvents = async ({
  userId,
  eventType,
  limit = 100,
  since,
}: {
  userId: string;
  eventType?: string;
  limit?: number;
  since?: Date;
}) => {
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
export const getUserEventCount = async ({
  userId,
  eventType,
  since,
}: {
  userId: string;
  eventType?: string;
  since?: Date;
}) => {
  return prisma.userEvent.count({
    where: {
      userId,
      ...(eventType && { eventType }),
      ...(since && { createdAt: { gte: since } }),
    },
  });
};
