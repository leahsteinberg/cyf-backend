import { getMeetingOffers, createOffer, setOffersExpired } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { isTimePast } from './utils.js';
import { getFriendIds } from './friendship.js';
import type { Meeting, Offer } from '../types.js';
import {
    getEffectiveTimeType,
    getEffectiveTargetType,
    IMMEDIATE_TIME_TYPE,
    UNKNOWN_TIME_TYPE,
    DISMISSED_DRAFT_MEETING_STATE,
    ACCEPTED_MEETING_STATE,
    PAST_MEETING_STATE,
    REJECTED_MEETING_STATE,
    ACCEPTED_OFFER_STATE,
    REJECTED_OFFER_STATE,
    EXPIRED_OFFER_STATE
} from '../types.js';
import { eventBus, EVENT_TYPES } from './events/index.js';
import { getUserContextInfo } from './query/user-lookup.js';


/**
 * Creates initial offers for a new meeting.
 *
 * Unified offer creation logic - uses meeting properties to determine:
 * - Who to send to: targetUserIds (if specified) OR all friends (if OPEN)
 * - When to expire: scheduledEnd (IMMEDIATE) OR scheduledFor (FUTURE)
 *
 * Handles all meeting types: OPEN, FRIEND_SPECIFIC, GROUP, IMMEDIATE, FUTURE
 */
export const processOffersForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    // Validate meeting exists and has required fields
    if (!meeting || !meeting.id || !meeting.userFromId) {
        throw new Error("Invalid meeting: missing required fields");
    }

    const timeType = getEffectiveTimeType(meeting);

    // Don't create offers for UNKNOWN time meetings (drafts)
    if (timeType === UNKNOWN_TIME_TYPE) {
        console.log('Meeting has UNKNOWN time type, skipping offer creation');
        return meeting;
    }

    // Use unified parallel offer creation for all meeting types
    return createParallelOffers(meeting);
}

/**
 * Unified parallel offer creation for all meeting types.
 *
 * Determines recipients and expiration from meeting properties:
 * - Recipients: meeting.targetUserIds (if exists) OR all friends (if empty/null)
 * - Expiration: meeting.scheduledEnd (IMMEDIATE) OR meeting.scheduledFor (FUTURE)
 *
 * This single function replaces:
 * - processNewBroadcastMeeting (IMMEDIATE + OPEN)
 * - processNewTargetedBroadcastMeeting (IMMEDIATE + FRIEND_SPECIFIC/GROUP)
 * - processNewFutureOpenMeeting (FUTURE + OPEN)
 * - processNewFriendSpecificMeeting (FUTURE + FRIEND_SPECIFIC)
 */
async function createParallelOffers(meeting: Meeting): Promise<Meeting> {
    // 1. Determine recipients based on targetUserIds
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const recipientIds = meeting.targetUserIds?.length > 0
        ? meeting.targetUserIds  // Specific users (FRIEND_SPECIFIC or GROUP)
        : allFriendIds;          // All friends (OPEN)

    if (recipientIds.length === 0) {
        console.log(`No recipients available for meeting ${meeting.id}`);
        return meeting;
    }

    // 2. Validate all recipients are friends
    const invalidTargets = recipientIds.filter(id => !allFriendIds.includes(id));
    if (invalidTargets.length > 0) {
        throw new Error(`Target users ${invalidTargets.join(', ')} are not friends of ${meeting.userFromId}`);
    }

    // 3. Determine expiration based on time type
    const timeType = getEffectiveTimeType(meeting);
    const targetType = getEffectiveTargetType(meeting);
    const expiresAt = timeType === IMMEDIATE_TIME_TYPE
        ? meeting.scheduledEnd  // Broadcasts: 1 hour from now
        : meeting.scheduledFor; // Future meetings: meeting start time

    // 4. Create all offers in parallel
    const offerPromises = recipientIds.map(friendId =>
        makeOffer({ meeting, userOfferedId: friendId, expiresAt })
    );
    await Promise.all(offerPromises);

    console.log(`Created ${recipientIds.length} offers for meeting ${meeting.id} (${timeType} + ${targetType})`);
    return meeting;
}


/**
 * Core offer creation function.
 * Creates an offer in the database and emits an event for push notification.
 */
export const makeOffer = async ({meeting, userOfferedId, expiresAt }:
    {meeting: Meeting; userOfferedId: string, expiresAt: Date
    }): Promise<Offer | undefined> => {
    const meetingId = meeting.id
    const offer = await createOffer({meetingId, userOfferedId, expiresAt});
    if (offer) {
        // Get broadcaster info for the notification
        const broadcaster = await getUserContextInfo({ userId: meeting.userFromId });
        const broadcasterDisplayName = broadcaster?.displayUsername
            || broadcaster?.username
            || broadcaster?.name
            || 'A friend';

        // Emit event for push notification
        eventBus.emitEvent({
            type: EVENT_TYPES.OFFER_CREATED,
            offerId: offer.id,
            meetingId: meeting.id,
            userOfferedId: offer.userOfferedId,
            broadcasterDisplayName,
            meetingTitle: meeting.title,
            scheduledFor: meeting.scheduledFor,
        });
    }
    return offer;
}

/**
 * Processes offers for an existing meeting (called by cron or after offer state changes).
 *
 * Unified processing logic for all parallel-offer meetings (IMMEDIATE and FUTURE).
 * Uses meeting properties to determine expiration time.
 *
 * NOTE: isBroadcasting flag is NOT managed here - it's handled in endpoint handlers
 * (broadcast-handler.ts) to keep flag management separate from offer processing.
 */
export const processOffersForMeeting = async (meeting: Meeting) => {
    // Skip processing DISMISSED meetings (they're kept for analytics only)
    if (meeting.meetingState === DISMISSED_DRAFT_MEETING_STATE) {
        console.log(`Skipping DISMISSED meeting ${meeting.id}`);
        return meeting;
    }

    // Use unified parallel processing for all modern meeting types
    // Falls back to old sequential logic for legacy meetings if needed
    return processParallelOffers(meeting);
}

/**
 * Unified parallel offer processing for all meeting types.
 *
 * Handles state transitions based on offer states:
 * - Meeting expired → PAST
 * - Offer accepted → ACCEPTED
 * - All offers rejected/expired → REJECTED
 *
 * This single function replaces:
 * - processOffersForBroadcastMeeting (IMMEDIATE meetings)
 * - processOffersForParallelMeeting (FUTURE + OPEN)
 * - processOffersForFriendSpecificMeeting (FRIEND_SPECIFIC)
 */
async function processParallelOffers(meeting: Meeting): Promise<Meeting> {
    const meetingId = meeting.id;
    const offers = await getMeetingOffers({ meetingId });

    // Determine expiration time based on meeting type
    const timeType = getEffectiveTimeType(meeting);
    const expirationTime = timeType === IMMEDIATE_TIME_TYPE
        ? meeting.scheduledEnd   // IMMEDIATE: expires 1 hour after start
        : meeting.scheduledFor;  // FUTURE: expires at meeting start time

    // Check if meeting is in the past
    const meetingInPast = await isTimePast({ eventTime: expirationTime });
    if (meetingInPast) {
        await setOffersExpired(offers);
        await setMeetingState({ meetingId, meetingState: PAST_MEETING_STATE });
        return meeting;
    }

    // Check for accepted offers
    const acceptedOffer = offers.find(o => o.offerState === ACCEPTED_OFFER_STATE);
    if (acceptedOffer) {
        // Clear all other offers and mark meeting as accepted
        await setOffersExpired(offers.filter(o => o.id !== acceptedOffer.id));
        await setMeetingState({ meetingId, meetingState: ACCEPTED_MEETING_STATE });
        return meeting;
    }

    // Check if all offers are rejected or expired
    const allRejectedOrExpired = offers.every(
        o => o.offerState === REJECTED_OFFER_STATE || o.offerState === EXPIRED_OFFER_STATE
    );
    if (allRejectedOrExpired && offers.length > 0) {
        await setMeetingState({ meetingId, meetingState: REJECTED_MEETING_STATE });
    }

    return meeting;
}

