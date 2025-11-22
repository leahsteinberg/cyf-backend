import { getMeetingOffers, findFriendIdToOffer, findRecentOffer, setOfferExpired, createOffer, getIsOfferExpired } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { ACCEPTED_MEETING_STATE, ACCEPTED_OFFER_STATE, addHour, EXPIRED_OFFER_STATE, isTimePast, minutesBetween, minutesSince, minutesUntil, OPEN_OFFER_STATE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, REJECTED_OFFER_STATE } from './utils.js';
import { findUnofferedFriends, getFriendIds, getUnofferedFriendsFromMeeting } from './friendship.js';
import type { Meeting, MeetingType, Offer } from '../types.js';
import { createAndSendOfferPush } from './create-push.js';
import { getUserTimezone } from './query/user-lookup.js';
import { setIsBroadcasting } from './update/user-update.js';




export const processOfferForNewMeeting = async (meeting: Meeting): Promise<Meeting> => {
    // Validate meeting exists and has required fields
    if (!meeting || !meeting.id || !meeting.userFromId) {
        throw new Error("Invalid meeting: missing required fields");
    }

    const meetingId = meeting.id;
    const allFriendIds = await getFriendIds(meeting.userFromId);
    const {friendToOfferId, unOfferedCount} = await findFriendIdToOffer({offers: [], meetingId, allFriendIds});

    if (friendToOfferId) {
        const offer = await makeAdvanceOffer({meeting, userOfferedId: friendToOfferId, remainingFriendsCount: unOfferedCount});

    }

    return meeting;
}

export const clearOutOffers = async (offers: Offer[]) => {
    for (let offer of offers) {
        if (offer.offerState === OPEN_OFFER_STATE) {
            await setOfferExpired({offerId: offer.id})
        }
    }
}


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
    const expiresAt = await determineOfferExpiration({meetingTime: meeting.scheduledFor, userToOfferId: userOfferedId, remainingFriendsCount})
    console.log("expires at-", expiresAt)
    const offer = await makeOffer({meeting, userOfferedId, expiresAt, offerType: 'ADVANCE'});
    return offer;
}


const makeOfferAfterExpired = async ({meeting, recentOfferId, newUserOfferId, remainingFriendsCount}:
    {meeting: Meeting; recentOfferId: string; newUserOfferId: string; remainingFriendsCount: number}) => {
    const expiredOffer = await setOfferExpired({offerId: recentOfferId});
    const expiresAt = await determineOfferExpiration({meetingTime: meeting.scheduledFor, userToOfferId: newUserOfferId, remainingFriendsCount})
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
        await clearOutOffers(offers);
        await setIsBroadcasting({userId: meeting.userFromId});
        return await setMeetingState({meetingId, meetingState: PAST_MEETING_STATE});
    }
    return meeting;
}


export const processOffersForMeeting = async (meeting: Meeting) => {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;


    if (meeting.meetingType === 'BROADCAST') {
        return processOffersForBroadcastMeeting(meeting);
    }

    // Get offers and clean up old ones first
    const offers = await getMeetingOffers({meetingId})
    const {recentOffer, olderOffers} = findRecentOffer(offers);

    const meetingInPast = await isTimePast({eventTime: meeting.scheduledFor});
    if (meetingInPast) {
        await clearOutOffers(offers);  // Clear ALL offers for past meetings
        return await setMeetingState({meetingId, meetingState: PAST_MEETING_STATE});
    }

    // For active meetings, only clear older offers
    await clearOutOffers(olderOffers);

    const allFriendIds = await getFriendIds(userFrom);
    const {friendToOfferId, unOfferedCount} = await findFriendIdToOffer({offers, meetingId, allFriendIds})

    // no more friends left, nothing to do.
    if (!friendToOfferId) return meeting;

    if (!recentOffer) {
        const newMeeting = await makeAdvanceOffer({meeting, userOfferedId: friendToOfferId, remainingFriendsCount: unOfferedCount})
        return newMeeting;
    }

    if (recentOffer.offerState === OPEN_OFFER_STATE) {
        const isOfferExpirationPast = await getIsOfferExpired({offer: recentOffer});
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
            const offer = await makeAdvanceOffer({meeting, userOfferedId: friendToOfferId, remainingFriendsCount: unOfferedCount})
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
