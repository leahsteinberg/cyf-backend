import type { Meeting, Offer } from '../types.js';
/**
 * Creates initial offers for a new meeting.
 *
 * Unified offer creation logic - uses meeting properties to determine:
 * - Who to send to: targetUserIds (if specified) OR all friends (if OPEN)
 * - When to expire: scheduledEnd (IMMEDIATE) OR scheduledFor (FUTURE)
 *
 * Handles all meeting types: OPEN, FRIEND_SPECIFIC, GROUP, IMMEDIATE, FUTURE
 */
export declare const processOffersForNewMeeting: (meeting: Meeting) => Promise<Meeting>;
/**
 * Core offer creation function.
 * Creates an offer in the database and sends a push notification.
 */
export declare const makeOffer: ({ meeting, userOfferedId, expiresAt }: {
    meeting: Meeting;
    userOfferedId: string;
    expiresAt: Date;
}) => Promise<Offer | undefined>;
/**
 * Processes offers for an existing meeting (called by cron or after offer state changes).
 *
 * Unified processing logic for all parallel-offer meetings (IMMEDIATE and FUTURE).
 * Uses meeting properties to determine expiration time.
 *
 * NOTE: isBroadcasting flag is NOT managed here - it's handled in endpoint handlers
 * (broadcast-handler.ts) to keep flag management separate from offer processing.
 */
export declare const processOffersForMeeting: (meeting: Meeting) => Promise<Meeting>;
//# sourceMappingURL=process-meeting.d.ts.map