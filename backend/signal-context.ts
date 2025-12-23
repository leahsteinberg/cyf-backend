import { prisma } from "./auth.js";
import { getUserSignalsForUser } from "./query/signal-lookup.js";
import { getFriendshipsUser1Side, getFriendshipsUser2Side } from "./query/friendship-lookup.js";
import { getCreatedMeetings, getAcceptedMeetings } from "./query/meeting-lookup.js";
import type { SignalType } from "../types.js";

export async function buildSuggestionContext(userId: string) {
    // Get user basic info
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            displayUsername: true,
            timezone: true,
            isBroadcasting: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new Error(`User not found: ${userId}`);
    }

    // Get all user signals
    const signals = await getUserSignalsForUser({ userId });

    // Organize signals by type for easier consumption
    const signalsByType: Record<SignalType, any[]> = {
        CALL_INTENT: [],
        WALK_PATTERN: [],
        TIME_OF_DAY_PREFERENCE: [],
        WORK_HOURS: []
    };

    signals.forEach(signal => {
        if (signalsByType[signal.type]) {
            signalsByType[signal.type].push({
                id: signal.id,
                payload: signal.payload,
                createdAt: signal.createdAt
            });
        }
    });

    // Get friendships (both sides since friendships can be in either direction)
    const friendshipsUser1 = await getFriendshipsUser1Side(userId);
    const friendshipsUser2 = await getFriendshipsUser2Side(userId);

    // Extract friend user IDs and get their details
    const friendIds = [
        ...friendshipsUser1.map(f => f.userId2),
        ...friendshipsUser2.map(f => f.userId1)
    ];

    const friends = await prisma.user.findMany({
        where: {
            id: { in: friendIds }
        },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            displayUsername: true,
            timezone: true
        }
    });

    // Get recent meetings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const createdMeetings = await getCreatedMeetings({ userFromId: userId });
    const acceptedMeetings = await getAcceptedMeetings({ acceptedUserId: userId });

    const recentCreatedMeetings = createdMeetings
        .filter(m => new Date(m.createdAt) >= thirtyDaysAgo)
        .map(m => ({
            id: m.id,
            title: m.title,
            scheduledFor: m.scheduledFor,
            scheduledEnd: m.scheduledEnd,
            meetingState: m.meetingState,
            timeType: m.timeType,
            targetType: m.targetType,
            sourceType: m.sourceType,
            intentLabel: m.intentLabel,
            targetUserId: m.targetUserId,
            acceptedUserId: m.acceptedUserId,
            createdAt: m.createdAt,
            role: 'creator' as const
        }));

    const recentAcceptedMeetings = acceptedMeetings
        .filter(m => new Date(m.createdAt) >= thirtyDaysAgo)
        .map(m => ({
            id: m.id,
            title: m.title,
            scheduledFor: m.scheduledFor,
            scheduledEnd: m.scheduledEnd,
            meetingState: m.meetingState,
            timeType: m.timeType,
            targetType: m.targetType,
            sourceType: m.sourceType,
            intentLabel: m.intentLabel,
            targetUserId: m.targetUserId,
            createdByUserId: m.userFromId,
            createdAt: m.createdAt,
            role: 'acceptor' as const
        }));

    const allRecentMeetings = [...recentCreatedMeetings, ...recentAcceptedMeetings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
            callIntents: signalsByType.CALL_INTENT,
            walkPatterns: signalsByType.WALK_PATTERN,
            timeOfDayPreferences: signalsByType.TIME_OF_DAY_PREFERENCE,
            workHours: signalsByType.WORK_HOURS
        },
        friends,
        recentMeetings: {
            total: allRecentMeetings.length,
            meetings: allRecentMeetings
        }
    };
  }
  