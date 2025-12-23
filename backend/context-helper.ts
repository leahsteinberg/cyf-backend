import type { Meeting, UserSignal, SignalType } from "../types.js";

export function buildCallIntentContext(signals: UserSignal<SignalType>[]) {
    return signals
        .filter(signal => signal.type === 'CALL_INTENT')
        .map(signal => ({
            id: signal.id,
            payload: signal.payload,
            createdAt: signal.createdAt
        }));
}

export function buildWalkPatternContext(signals: UserSignal<SignalType>[]) {
    return signals
        .filter(signal => signal.type === 'WALK_PATTERN')
        .map(signal => ({
            id: signal.id,
            payload: signal.payload,
            createdAt: signal.createdAt
        }));
}

export function buildTimeOfDayPreferenceContext(signals: UserSignal<SignalType>[]) {
    return signals
        .filter(signal => signal.type === 'TIME_OF_DAY_PREFERENCE')
        .map(signal => ({
            id: signal.id,
            payload: signal.payload,
            createdAt: signal.createdAt
        }));
}

export function buildWorkHoursContext(signals: UserSignal<SignalType>[]) {
    return signals
        .filter(signal => signal.type === 'WORK_HOURS')
        .map(signal => ({
            id: signal.id,
            payload: signal.payload,
            createdAt: signal.createdAt
        }));
}

export function buildRecentMeetingsContext(
    createdMeetings: Meeting[],
    acceptedMeetings: Meeting[],
    daysBack: number = 30
) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentCreatedMeetings = createdMeetings
        .filter(m => new Date(m.createdAt) >= cutoffDate)
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
        .filter(m => new Date(m.createdAt) >= cutoffDate)
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
        total: allRecentMeetings.length,
        meetings: allRecentMeetings
    };
}
