import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer, getIsOfferExpired, setOffersExpired } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { addHour, isTimePast, minutesBetween, minutesSince, minutesUntil } from './utils.js';
import { findUnofferedFriends, getFriendIds, getUnofferedFriendsFromMeeting } from './friendship.js';
import type { Meeting, MeetingType, Offer } from '../types.js';
import {
    getEffectiveTimeType,
    getEffectiveTargetType,
    IMMEDIATE_TIME_TYPE,
    FUTURE_TIME_TYPE,
    UNKNOWN_TIME_TYPE,
    OPEN_TARGET_TYPE,
    FRIEND_SPECIFIC_TARGET_TYPE,
    DISMISSED_MEETING_STATE_TYPE,
    ACCEPTED_MEETING_STATE_TYPE,
    PAST_MEETING_STATE_TYPE,
    REJECTED_MEETING_STATE_TYPE,
    ACCEPTED_OFFER_STATE_TYPE,
    OPEN_OFFER_STATE_TYPE,
    REJECTED_OFFER_STATE_TYPE,
    EXPIRED_OFFER_STATE_TYPE
} from '../types.js';
import { createAndSendOfferPush } from './create-push.js';
import { getUserTimezone } from './query/user-lookup.js';
import { setIsBroadcasting, setIsNotBroadcasting } from './update/user-update.js';




/**
 * Creates initial offers for a new meeting based on its type
 * Routes to appropriate offer creation logic using new flexible type system
 */
export const processOfferForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    // Validate meeting exists and has required fields
    if (!meeting || !meeting.id || !meeting.userFromId) {
        throw new Error("Invalid meeting: missing required fields");
    }

    // Use helper functions to get effective types (with fallback to old system)
    const timeType = getEffectiveTimeType(meeting);
    const targetType = getEffectiveTargetType(meeting);

    console.log(`Processing new meeting: timeType=${timeType}, targetType=${targetType}`);

    // Route based on flexible type combination
    if (timeType === IMMEDIATE_TIME_TYPE && targetType === OPEN_TARGET_TYPE) {
        // BROADCAST: Parallel offers to all friends, immediate
        return await processNewBroadcastMeeting(meeting);
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
 * Process new BROADCAST meeting (IMMEDIATE + OPEN)
 * Creates offers to all friends immediately with 1-hour expiration
 */
async function processNewBroadcastMeeting(meeting: Meeting): Promise<Meeting> {
    const allFriendIds = await getFriendIds(meeting.userFromId);

    // Create offers to all friends in parallel
    const offerPromises = allFriendIds.map(friendId =>
        makeBroadcastOffer({ meeting, userOfferedId: friendId })
    );

    await Promise.all(offerPromises);

    console.log(`Created ${allFriendIds.length} broadcast offers for meeting ${meeting.id}`);
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
            offerType: 'ADVANCE' // Keep as ADVANCE for backwards compatibility
        });
    });

    await Promise.all(offerPromises);

    console.log(`Created ${allFriendIds.length} parallel offers for FUTURE+OPEN meeting ${meeting.id}`);
    return meeting;
}

/**
 * DEPRECATED: Old sequential offer behavior for ADVANCE meetings
 * Kept for backwards compatibility, but new FUTURE+OPEN meetings use processNewFutureOpenMeeting instead
 */
async function processNewAdvanceMeeting(meeting: Meeting): Promise<Meeting> {
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const { friendToOfferId, unOfferedCount } = await findFriendIdToOffer({
        offers: [],
        meetingId: meeting.id,
        allFriendIds
    });

    if (friendToOfferId) {
        await makeAdvanceOffer({
            meeting,
            userOfferedId: friendToOfferId,
            remainingFriendsCount: unOfferedCount
        });
        console.log(`Created sequential offer for meeting ${meeting.id}`);
    } else {
        console.log(`No friends available for meeting ${meeting.id}`);
    }

    return meeting;
}

/**
 * Process new FRIEND_SPECIFIC meeting
 * Creates single offer to the specified friend
 */
async function processNewFriendSpecificMeeting(meeting: Meeting): Promise<Meeting> {
    const targetUserId = meeting.targetUserId;

    if (!targetUserId) {
        throw new Error('FRIEND_SPECIFIC meeting missing targetUserId');
    }

    // Verify target user is a friend
    const allFriendIds = await getFriendIds(meeting.userFromId);
    if (!allFriendIds.includes(targetUserId)) {
        throw new Error(`Target user ${targetUserId} is not a friend of ${meeting.userFromId}`);
    }

    // Determine offer type based on time type
    const timeType = getEffectiveTimeType(meeting);

    if (timeType === IMMEDIATE_TIME_TYPE) {
        // Immediate 1-on-1: use broadcast-style expiration (1 hour)
        await makeBroadcastOffer({ meeting, userOfferedId: targetUserId });
    } else {
        // Future 1-on-1: use meeting time as expiration
        const expiresAt = meeting.scheduledFor;
        await makeOffer({
            meeting,
            userOfferedId: targetUserId,
            expiresAt,
            offerType: 'ADVANCE'
        });
    }

    console.log(`Created friend-specific offer for meeting ${meeting.id} to user ${targetUserId}`);
    return meeting;
}

export const clearOutOffers = async (offers: Offer[]) => {
    for (let offer of offers) {
        if (offer.offerState === OPEN_OFFER_STATE_TYPE) {
            await setOfferExpired({offerId: offer.id})
        }
    }
}

/// TO BE DEPRECATED
const determineOfferExpiration = async ({meetingTime, userToOfferId, remainingFriendsCount}:
    {meetingTime: Date; userToOfferId: string, remainingFriendsCount: number}): Promise<Date> => {

    const now = new Date();

    // Calculate time from now until the meeting
    const minutesUntilMeeting = await minutesUntil({eventTime: meetingTime});

    // If no more friends, set expiration to scheduledFor time
    if (remainingFriendsCount === 0) {
        return meetingTime;
    }

    // Try to chop up the time equally between number of friends
    let minutesPerFriend = minutesUntilMeeting / remainingFriendsCount;

    // Apply minimum constraints
    if (minutesUntilMeeting <= 120 && remainingFriendsCount > 2) {
        // If 2 hours or less and more than 2 friends, minimum is 30 mins
        minutesPerFriend = Math.max(30, minutesPerFriend);
    } else if (minutesUntilMeeting > 120) {
        // If more than 2 hours, minimum is 1 hour
        minutesPerFriend = Math.max(60, minutesPerFriend);
    }

    // Calculate the expiration time
    let expirationTime = new Date(now.getTime() + minutesPerFriend * 60 * 1000);

    // If this time is past the scheduledFor time, cap at scheduledFor time
    if (expirationTime > meetingTime) {
        expirationTime = meetingTime;
    }

    // Handle sleep time (10pm-10am) based on offer-receiving-user's timezone
    const userTimezone = await getUserTimezone({ userId: userToOfferId });

    if (userTimezone) {
        try {
            // Get the hour in the user's local timezone
            const timeString = expirationTime.toLocaleString('en-US', {
                timeZone: userTimezone,
                hour: '2-digit',
                hour12: false
            });

            if (!timeString) {
                throw new Error('Unable to get time string for user timezone');
            }

            const userLocalHour = parseInt(timeString.split(':')[0]);

            // Check if expiration falls during sleep time: 10pm (22:00) to 10am (10:00)
            const isDuringSleepTime = userLocalHour >= 22 || userLocalHour < 10;

            if (isDuringSleepTime) {
                // Simplified approach: Add time to push to 10am
                // If between midnight and 10am, push forward to 10am same day
                // If between 10pm and midnight, push forward to 10am next day

                let hoursToAdd = 0;
                if (userLocalHour >= 22) {
                    // Between 10pm-midnight: push to 10am next day
                    hoursToAdd = (24 - userLocalHour) + 10;
                } else if (userLocalHour < 10) {
                    // Between midnight-10am: push to 10am same day
                    hoursToAdd = 10 - userLocalHour;
                }

                // Add the hours to current expiration time
                expirationTime = new Date(expirationTime.getTime() + hoursToAdd * 60 * 60 * 1000);

                // Ensure we don't exceed meeting time
                if (expirationTime > meetingTime) {
                    expirationTime = meetingTime;
                }
            }
        } catch (error) {
            // If timezone handling fails, log and continue with original expiration time
            console.error('Error handling timezone for offer expiration:', error);
            // Fall through to return original expirationTime
        }
    }

    return expirationTime;
};

export const makeBroadcastOffer = async({meeting, userOfferedId}:
    {meeting: Meeting; userOfferedId: string
    }): Promise<Offer | undefined> => {
        const expiresAt = addHour(new Date());
        const offer = await makeOffer({meeting, userOfferedId, expiresAt, offerType: 'BROADCAST'});
        return offer;
    }


export const makeAdvanceOffer = async ({meeting, userOfferedId, remainingFriendsCount}:
    {meeting: Meeting; userOfferedId: string; remainingFriendsCount: number}): Promise<Offer | undefined> => {
    //const expiresAt = await determineOfferExpiration({meetingTime: meeting.scheduledFor, userToOfferId: userOfferedId, remainingFriendsCount})
    const expiresAt = meeting.scheduledFor;
    console.log("expires at-", expiresAt)
    const offer = await makeOffer({meeting, userOfferedId, expiresAt, offerType: 'ADVANCE'});
    return offer;
}


const makeOfferAfterExpired = async ({meeting, recentOfferId, newUserOfferId, remainingFriendsCount}:
    {meeting: Meeting; recentOfferId: string; newUserOfferId: string; remainingFriendsCount: number}) => {
    const expiredOffer = await setOfferExpired({offerId: recentOfferId});
    // const expiresAt = await determineOfferExpiration({meetingTime: meeting.scheduledFor, userToOfferId: newUserOfferId, remainingFriendsCount})
    const expiresAt = meeting.scheduledFor;
    const newOffer = await makeOffer({meeting, userOfferedId: newUserOfferId, expiresAt, offerType: 'ADVANCE'})
    return [expiredOffer, newOffer];
};

export const makeOffer = async ({meeting, userOfferedId, expiresAt, offerType}:
    {meeting: Meeting; userOfferedId: string, expiresAt: Date, offerType: MeetingType
    }): Promise<Offer | undefined> => {
    const meetingId = meeting.id
    const offer = await createOffer({meetingId, userOfferedId, expiresAt, offerType});
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
        await setIsNotBroadcasting({userId: meeting.userFromId});
        return await setMeetingState({meetingId, meetingState: PAST_MEETING_STATE_TYPE});
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
    if (meeting.meetingState === DISMISSED_MEETING_STATE_TYPE) {
        console.log(`Skipping DISMISSED meeting ${meeting.id}`);
        return meeting;
    }

    // Use helper functions to get effective types (with fallback to old system)
    const timeType = getEffectiveTimeType(meeting);
    const targetType = getEffectiveTargetType(meeting);

    // Handle BROADCAST meetings (IMMEDIATE + OPEN)
    if (timeType === IMMEDIATE_TIME_TYPE && targetType === OPEN_TARGET_TYPE) {
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
        return await setMeetingState({ meetingId, meetingState: PAST_MEETING_STATE_TYPE });
    }

    // Check if any offer was accepted
    const acceptedOffer = offers.find(o => o.offerState === ACCEPTED_OFFER_STATE_TYPE);
    if (acceptedOffer) {
        // Clear all other offers and mark meeting as accepted
        await setOffersExpired(offers.filter(o => o.id !== acceptedOffer.id));
        await setMeetingState({ meetingId, meetingState: ACCEPTED_MEETING_STATE_TYPE });
        return meeting;
    }

    // Check if all offers are rejected or expired
    const allRejectedOrExpired = offers.every(
        o => o.offerState === REJECTED_OFFER_STATE_TYPE || o.offerState === EXPIRED_OFFER_STATE_TYPE
    );

    if (allRejectedOrExpired && offers.length > 0) {
        await setMeetingState({ meetingId, meetingState: REJECTED_MEETING_STATE_TYPE });
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
        return await setMeetingState({ meetingId, meetingState: PAST_MEETING_STATE_TYPE });
    }

    // Should only have one offer
    const offer = offers[0];
    if (!offer) {
        console.warn(`FRIEND_SPECIFIC meeting ${meetingId} has no offers`);
        return meeting;
    }

    // Update meeting state based on offer state
    if (offer.offerState === ACCEPTED_OFFER_STATE_TYPE) {
        await setMeetingState({ meetingId, meetingState: ACCEPTED_MEETING_STATE_TYPE });
    } else if (offer.offerState === REJECTED_OFFER_STATE_TYPE || offer.offerState === EXPIRED_OFFER_STATE_TYPE) {
        await setMeetingState({ meetingId, meetingState: REJECTED_MEETING_STATE_TYPE });
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
        return await setMeetingState({ meetingId, meetingState: PAST_MEETING_STATE_TYPE });
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

    if (recentOffer.offerState === OPEN_OFFER_STATE_TYPE) {
        const isOfferExpirationPast = await getIsOfferExpired({ offer: recentOffer });
        if (isOfferExpirationPast) {
            await makeOfferAfterExpired({
                meeting,
                recentOfferId: recentOffer.id,
                newUserOfferId: friendToOfferId,
                remainingFriendsCount: unOfferedCount
            });
        }
    } else if (recentOffer.offerState === REJECTED_OFFER_STATE_TYPE) {
        if (!friendToOfferId) {
            // No more friends to offer to, set meeting state to REJECTED
            console.log("No more friends to offer to, setting meeting to REJECTED");
            await setMeetingState({
                meetingId,
                meetingState: REJECTED_MEETING_STATE_TYPE
            });
        } else {
            await makeAdvanceOffer({ meeting, userOfferedId: friendToOfferId, remainingFriendsCount: unOfferedCount });
        }
    } else if (recentOffer.offerState === ACCEPTED_OFFER_STATE_TYPE) {
        await setMeetingState({
            meetingId,
            meetingState: ACCEPTED_MEETING_STATE_TYPE
        });
    } else if (recentOffer.offerState === EXPIRED_OFFER_STATE_TYPE) {
        await makeOfferAfterExpired({
            meeting,
            recentOfferId: recentOffer.id,
            newUserOfferId: friendToOfferId,
            remainingFriendsCount: unOfferedCount
        });
    }
    return meeting;
}
