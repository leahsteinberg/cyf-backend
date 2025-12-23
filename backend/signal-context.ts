import { getUserContextInfo } from "./query/user-lookup.js";
import { getUserSignalsForUser } from "./query/signal-lookup.js";
import { getFriendsWithDetails } from "./query/friendship-lookup.js";
import { getCreatedMeetings, getAcceptedMeetings } from "./query/meeting-lookup.js";
import {
    buildCallIntentContext,
    buildWalkPatternContext,
    buildTimeOfDayPreferenceContext,
    buildWorkHoursContext,
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

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            displayUsername: user.displayUsername,
            timezone: user.timezone,
            isBroadcasting: user.isBroadcasting,
            memberSince: user.createdAt
        },
        signals: {
            callIntents: buildCallIntentContext(signals),
            walkPatterns: buildWalkPatternContext(signals),
            timeOfDayPreferences: buildTimeOfDayPreferenceContext(signals),
            workHours: buildWorkHoursContext(signals)
        },
        friends,
        recentMeetings: buildRecentMeetingsContext(createdMeetings, acceptedMeetings)
    };
  }
  