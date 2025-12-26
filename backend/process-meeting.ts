import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer, getIsOfferExpired, setOffersExpired } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { addHour, isTimePast } from './utils.js';
import { getFriendIds } from './friendship.js';
import type { Meeting, Offer } from '../types.js';
import {
    getEffectiveTimeType,
    getEffectiveTargetType,
    IMMEDIATE_TIME_TYPE,
    FUTURE_TIME_TYPE,
    UNKNOWN_TIME_TYPE,
    OPEN_TARGET_TYPE,
    FRIEND_SPECIFIC_TARGET_TYPE,
    GROUP_TARGET_TYPE,
    DISMISSED_DRAFT_MEETING_STATE,
    ACCEPTED_MEETING_STATE,
    PAST_MEETING_STATE,
    REJECTED_MEETING_STATE,
    ACCEPTED_OFFER_STATE,
    OPEN_OFFER_STATE,
    REJECTED_OFFER_STATE,
    EXPIRED_OFFER_STATE
} from '../types.js';
import { createAndSendOfferPush } from './create-push.js';
import { setIsNotBroadcasting } from './update/user-update.js';


/**
 * Creates initial offers for a new meeting based on its type
 * Routes to appropriate offer creation logic using new flexible type system
 */
export const processOffersForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    // Validate meeting exists and has required fields
    if (!meeting || !meeting.id || !meeting.userFromId) {
        throw new Error("Invalid meeting: missing required fields");
    }

    // Use helper functions to get effective types (with fallback to old system)
    const timeType = getEffectiveTimeType(meeting);
    const targetType = getEffectiveTargetType(meeting);

    console.log(`Processing new meeting: timeType=${timeType}, targetType=${targetType}`);

    // Route based on flexible type combination
    // Handle ALL IMMEDIATE meetings (broadcasts - can be OPEN, FRIEND_SPECIFIC, or GROUP)
    if (timeType === IMMEDIATE_TIME_TYPE) {
        if (targetType === OPEN_TARGET_TYPE) {
            // OPEN BROADCAST: Parallel offers to all friends, immediate
            return await processNewBroadcastMeeting(meeting);
        } else if (targetType === FRIEND_SPECIFIC_TARGET_TYPE || targetType === GROUP_TARGET_TYPE) {
            // TARGETED BROADCAST: Offers to specific users, immediate
            return await processNewTargetedBroadcastMeeting(meeting);
        }
    }

    if (timeType === FUTURE_TIME_TYPE && targetType === OPEN_TARGET_TYPE) {
        // NEW BEHAVIOR: Parallel offers to all friends, scheduled for later
        return await processNewFutureOpenMeeting(meeting);
    }

    if (targetType === FRIEND_SPECIFIC_TARGET_TYPE) {
        // FRIEND_SPECIFIC: Single offer to specific friend
        return await processNewFriendSpecificMeeting(meeting);
    }

    if (timeType === UNKNOWN_TIME_TYPE) {
        // UNKNOWN time: Don't create offers yet, wait for time to be set
        console.log('Meeting has UNKNOWN time type, skipping offer creation');
        return meeting;
    }

    // Fallback: treat as FUTURE + OPEN
    console.warn(`Unknown meeting type combination: ${timeType} + ${targetType}, defaulting to FUTURE+OPEN`);
    return await processNewFutureOpenMeeting(meeting);
}

/**
 * Process new OPEN BROADCAST meeting (IMMEDIATE + OPEN)
 * Creates offers to all friends immediately with 1-hour expiration
 */
async function processNewBroadcastMeeting(meeting: Meeting): Promise<Meeting> {
    const allFriendIds = await getFriendIds(meeting.userFromId);

    // Create offers to all friends in parallel
    const offerPromises = allFriendIds.map(friendId =>
        makeBroadcastOffer({ meeting, userOfferedId: friendId })
    );

    await Promise.all(offerPromises);

    console.log(`Created ${allFriendIds.length} OPEN broadcast offers for meeting ${meeting.id}`);
    return meeting;
}

/**
 * Process new TARGETED BROADCAST meeting (IMMEDIATE + FRIEND_SPECIFIC or GROUP)
 * Creates offers to specific users immediately with 1-hour expiration
 */
async function processNewTargetedBroadcastMeeting(meeting: Meeting): Promise<Meeting> {
    const targetUserIds = meeting.targetUserIds;

    if (!targetUserIds || targetUserIds.length === 0) {
        throw new Error('Targeted broadcast meeting missing targetUserIds');
    }

    // Verify all target users are friends
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const invalidTargets = targetUserIds.filter(id => !allFriendIds.includes(id));
    if (invalidTargets.length > 0) {
        throw new Error(`Target users ${invalidTargets.join(', ')} are not friends of ${meeting.userFromId}`);
    }

    // Create immediate offers to each target user
    const offerPromises = targetUserIds.map(friendId =>
        makeBroadcastOffer({ meeting, userOfferedId: friendId })
    );

    await Promise.all(offerPromises);

    console.log(`Created ${targetUserIds.length} targeted broadcast offers for meeting ${meeting.id}`);
    return meeting;
}

/**
 * NEW BEHAVIOR: Process FUTURE + OPEN meeting
 * Creates parallel offers to ALL friends (not sequential)
 * Expiration set to meeting scheduledFor time
 */
async function processNewFutureOpenMeeting(meeting: Meeting): Promise<Meeting> {
    const allFriendIds = await getFriendIds(meeting.userFromId);

    if (allFriendIds.length === 0) {
        console.log(`No friends available for meeting ${meeting.id}`);
        return meeting;
    }

    // Create offers to all friends in parallel, expiring at meeting time
    const offerPromises = allFriendIds.map(async (friendId) => {
        // Use meeting's scheduledFor time as expiration
        const expiresAt = meeting.scheduledFor;
        return makeOffer({
            meeting,
            userOfferedId: friendId,
            expiresAt,
        });
    });

    await Promise.all(offerPromises);

    console.log(`Created ${allFriendIds.length} parallel offers for FUTURE+OPEN meeting ${meeting.id}`);
    return meeting;
}

/**
 * Process new FRIEND_SPECIFIC meeting
 * Creates offers to the specified friends
 */
async function processNewFriendSpecificMeeting(meeting: Meeting): Promise<Meeting> {
    const targetUserIds = meeting.targetUserIds;

    if (!targetUserIds || targetUserIds.length === 0) {
        throw new Error('FRIEND_SPECIFIC meeting missing targetUserIds');
    }

    // Verify all target users are friends
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const invalidTargets = targetUserIds.filter(id => !allFriendIds.includes(id));
    if (invalidTargets.length > 0) {
        throw new Error(`Target users ${invalidTargets.join(', ')} are not friends of ${meeting.userFromId}`);
    }

    // Determine offer type based on time type
    const timeType = getEffectiveTimeType(meeting);

    // Create offers for each target user
    for (const targetUserId of targetUserIds) {
        if (timeType === IMMEDIATE_TIME_TYPE) {
            // Immediate 1-on-1: use broadcast-style expiration (1 hour)
            await makeBroadcastOffer({ meeting, userOfferedId: targetUserId });
        } else if (timeType === FUTURE_TIME_TYPE || timeType === UNKNOWN_TIME_TYPE){
            // Future 1-on-1: use meeting time as expiration
            const expiresAt = meeting.scheduledFor;
            await makeOffer({
                meeting,
                userOfferedId: targetUserId,
                expiresAt,
            });
        }
    }

    console.log(`Created friend-specific offers for meeting ${meeting.id} to users ${targetUserIds.join(', ')}`);
    return meeting;
}

export const makeBroadcastOffer = async({meeting, userOfferedId}:
    {meeting: Meeting; userOfferedId: string
    }): Promise<Offer | undefined> => {
        const expiresAt = addHour(new Date());
        const offer = await makeOffer({meeting, userOfferedId, expiresAt});
        return offer;
    }


export const makeAdvanceOffer = async ({meeting, userOfferedId, remainingFriendsCount}:
    {meeting: Meeting; userOfferedId: string; remainingFriendsCount: number}): Promise<Offer | undefined> => {
    //const expiresAt = await determineOfferExpiration({meetingTime: meeting.scheduledFor, userToOfferId: userOfferedId, remainingFriendsCount})
    const expiresAt = meeting.scheduledFor;
    console.log("expires at-", expiresAt)
    const offer = await makeOffer({meeting, userOfferedId, expiresAt});
    return offer;
}


const makeOfferAfterExpired = async ({meeting, recentOfferId, newUserOfferId, remainingFriendsCount}:
    {meeting: Meeting; recentOfferId: string; newUserOfferId: string; remainingFriendsCount: number}) => {
    const expiredOffer = await setOfferExpired({offerId: recentOfferId});
    // const expiresAt = await determineOfferExpiration({meetingTime: meeting.scheduledFor, userToOfferId: newUserOfferId, remainingFriendsCount})
    const expiresAt = meeting.scheduledFor;
    const newOffer = await makeOffer({meeting, userOfferedId: newUserOfferId, expiresAt})
    return [expiredOffer, newOffer];
};

export const makeOffer = async ({meeting, userOfferedId, expiresAt }:
    {meeting: Meeting; userOfferedId: string, expiresAt: Date
    }): Promise<Offer | undefined> => {
    const meetingId = meeting.id
    const offer = await createOffer({meetingId, userOfferedId, expiresAt});
    console.log("New Offer", offer)
    if (offer) {
        createAndSendOfferPush({ offer });
    }
    return offer;
}

const processOffersForBroadcastMeeting = async(meeting: Meeting) => {
    const meetingId = meeting.id;
    const meetingInPast = await isTimePast({eventTime: meeting.scheduledEnd});
    if (meetingInPast) {
        const offers = await getMeetingOffers({meetingId})
        await setOffersExpired(offers);

        // Only turn off isBroadcasting flag for OPEN broadcasts, not targeted broadcasts
        const targetType = getEffectiveTargetType(meeting);
        if (targetType === OPEN_TARGET_TYPE) {
            await setIsNotBroadcasting({userId: meeting.userFromId});
        }

        return await setMeetingState({meetingId, meetingState: PAST_MEETING_STATE});
    }
    return meeting;
}


/**
 * Processes offers for an existing meeting (called by cron or after offer state changes)
 * Uses new flexible type system with fallback to old meetingType
 *
 * NOTE: DISMISSED meetings should be skipped by the cron job before calling this function
 * - DISMISSED meetings have no active offers and shouldn't be processed
 * - They're kept for analytics but are functionally "dead"
 * - TODO: Add early return if meeting.meetingState === 'DISMISSED'
 */
export const processOffersForMeeting = async (meeting: Meeting) => {
    // Skip processing DISMISSED meetings (they're kept for analytics only)
    if (meeting.meetingState === DISMISSED_DRAFT_MEETING_STATE) {
        console.log(`Skipping DISMISSED meeting ${meeting.id}`);
        return meeting;
    }

    // Use helper functions to get effective types (with fallback to old system)
    const timeType = getEffectiveTimeType(meeting);
    const targetType = getEffectiveTargetType(meeting);

    // Handle ALL BROADCAST meetings (any IMMEDIATE meeting, regardless of target)
    if (timeType === IMMEDIATE_TIME_TYPE) {
        return processOffersForBroadcastMeeting(meeting);
    }

    // For FUTURE + OPEN meetings: All offers created at once, no sequential processing needed
    // Just check if meeting is in past or if all offers expired/rejected
    if (timeType === FUTURE_TIME_TYPE && targetType === OPEN_TARGET_TYPE) {
        return processOffersForParallelMeeting(meeting);
    }

    // For FRIEND_SPECIFIC meetings: Single offer, simpler logic
    if (targetType === FRIEND_SPECIFIC_TARGET_TYPE) {
        return processOffersForFriendSpecificMeeting(meeting);
    }

    // Fallback: Use old ADVANCE logic for unknown combinations
    console.warn(`Unknown meeting type in processOffersForMeeting: ${timeType} + ${targetType}`);
    return processOffersForAdvanceMeeting(meeting);
}

/**
 * Process offers for FUTURE + OPEN meetings (parallel offers to all friends)
 * Since all offers are created at once, just check for meeting expiration and acceptance
 */
async function processOffersForParallelMeeting(meeting: Meeting): Promise<Meeting> {
    const meetingId = meeting.id;
    const offers = await getMeetingOffers({ meetingId });

    // Check if meeting is in the past
    const meetingInPast = await isTimePast({ eventTime: meeting.scheduledFor });
    if (meetingInPast) {
        await setOffersExpired(offers);
        return await setMeetingState({ meetingId, meetingState: PAST_MEETING_STATE });
    }

    // Check if any offer was accepted
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

/**
 * Process offers for FRIEND_SPECIFIC meetings (single offer to one friend)
 */
async function processOffersForFriendSpecificMeeting(meeting: Meeting): Promise<Meeting> {
    const meetingId = meeting.id;
    const offers = await getMeetingOffers({ meetingId });

    // Check if meeting is in the past
    const meetingInPast = await isTimePast({ eventTime: meeting.scheduledFor });
    if (meetingInPast) {
        await setOffersExpired(offers);
        return await setMeetingState({ meetingId, meetingState: PAST_MEETING_STATE });
    }

    // Should only have one offer
    const offer = offers[0];
    if (!offer) {
        console.warn(`FRIEND_SPECIFIC meeting ${meetingId} has no offers`);
        return meeting;
    }

    // Update meeting state based on offer state
    if (offer.offerState === ACCEPTED_OFFER_STATE) {
        await setMeetingState({ meetingId, meetingState: ACCEPTED_MEETING_STATE });
    } else if (offer.offerState === REJECTED_OFFER_STATE || offer.offerState === EXPIRED_OFFER_STATE) {
        await setMeetingState({ meetingId, meetingState: REJECTED_MEETING_STATE });
    }

    return meeting;
}

/**
 * OLD SEQUENTIAL LOGIC: Process offers for ADVANCE meetings
 * Kept for backwards compatibility with existing sequential meetings
 */
async function processOffersForAdvanceMeeting(meeting: Meeting): Promise<Meeting> {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;

    // Get offers and clean up old ones first
    const offers = await getMeetingOffers({ meetingId });
    const { recentOffer, olderOffers } = findRecentOffer(offers);

    const meetingInPast = await isTimePast({ eventTime: meeting.scheduledFor });
    if (meetingInPast) {
        await setOffersExpired(offers);  // Clear ALL offers for past meetings
        return await setMeetingState({ meetingId, meetingState: PAST_MEETING_STATE });
    }

    // For active meetings, only clear older offers
    await setOffersExpired(olderOffers);

    const allFriendIds = await getFriendIds(userFrom);
    const { friendToOfferId, unOfferedCount } = await findFriendIdToOffer({ offers, meetingId, allFriendIds });

    // no more friends left, nothing to do.
    if (!friendToOfferId) return meeting;

    if (!recentOffer) {
        await makeAdvanceOffer({ meeting, userOfferedId: friendToOfferId, remainingFriendsCount: unOfferedCount });
        return meeting;
    }

    if (recentOffer.offerState === OPEN_OFFER_STATE) {
        const isOfferExpirationPast = await getIsOfferExpired({ offer: recentOffer });
        if (isOfferExpirationPast) {
            await makeOfferAfterExpired({
                meeting,
                recentOfferId: recentOffer.id,
                newUserOfferId: friendToOfferId,
                remainingFriendsCount: unOfferedCount
            });
        }
    } else if (recentOffer.offerState === REJECTED_OFFER_STATE) {
        if (!friendToOfferId) {
            // No more friends to offer to, set meeting state to REJECTED
            console.log("No more friends to offer to, setting meeting to REJECTED");
            await setMeetingState({
                meetingId,
                meetingState: REJECTED_MEETING_STATE
            });
        } else {
            await makeAdvanceOffer({ meeting, userOfferedId: friendToOfferId, remainingFriendsCount: unOfferedCount });
        }
    } else if (recentOffer.offerState === ACCEPTED_OFFER_STATE) {
        await setMeetingState({
            meetingId,
            meetingState: ACCEPTED_MEETING_STATE
        });
    } else if (recentOffer.offerState === EXPIRED_OFFER_STATE) {
        await makeOfferAfterExpired({
            meeting,
            recentOfferId: recentOffer.id,
            newUserOfferId: friendToOfferId,
            remainingFriendsCount: unOfferedCount
        });
    }
    return meeting;
}
