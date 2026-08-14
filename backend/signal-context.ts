import { getUserContextInfo, getIsBroadcasting } from "./query/user-lookup.js";
import { getUserSignalsForUser } from "./query/signal-lookup.js";
import { getFriendsWithDetails } from "./query/friendship-lookup.js";
import { enrichFriendsWithBroadcastStatus, enrichFriendsWithCallIntents } from "./friend-enrichment.js";
import { getCreatedMeetings, getAcceptedMeetings } from "./query/meeting-lookup.js";
import {
    buildCallIntentContext,
    buildWalkPatternContext,
    buildTimeOfDayPreferenceContext,
    buildWorkHoursContext,
    buildSocialBatteryContext,
    buildRecentMeetingsContext
} from "./context-helper.js";

export async function buildSuggestionContext(userId: string) {
    const user = await getUserContextInfo({ userId });

    if (!user) {
        throw new Error(`User not found: ${userId}`);
    }

    const signals = await getUserSignalsForUser({ userId });
    const friends = await getFriendsWithDetails({ userId });
    const createdMeetings = await getCreatedMeetings({ userFromId: userId });
    const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userId });

    // Enrich friends with viewer-specific broadcast status
    const withBroadcastStatus = await enrichFriendsWithBroadcastStatus({
        friends,
        viewerId: userId
    });

    // Enrich with call intent status (both directions)
    const enrichedFriends = await enrichFriendsWithCallIntents({
        friends: withBroadcastStatus,
        viewerId: userId
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            displayUsername: user.displayUsername,
            timezone: user.timezone,
            isBroadcasting: await getIsBroadcasting({ userId }),
            memberSince: user.createdAt
        },
        signals: {
            callIntents: buildCallIntentContext(signals),
            walkPatterns: buildWalkPatternContext(signals),
            timeOfDayPreferences: buildTimeOfDayPreferenceContext(signals),
            workHours: buildWorkHoursContext(signals),
            socialBattery: buildSocialBatteryContext(signals),
        },
        friends: enrichedFriends,
        recentMeetings: buildRecentMeetingsContext(createdMeetings, acceptedMeetings)
    };
  }
  