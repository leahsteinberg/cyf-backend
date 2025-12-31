export function buildCallIntentContext(signals) {
    return signals
        .filter(signal => signal.type === 'CALL_INTENT')
        .map(signal => ({
        id: signal.id,
        payload: signal.payload,
        createdAt: signal.createdAt
    }));
}
export function buildWalkPatternContext(signals) {
    return signals
        .filter(signal => signal.type === 'WALK_PATTERN')
        .map(signal => ({
        id: signal.id,
        payload: signal.payload,
        createdAt: signal.createdAt
    }));
}
export function buildTimeOfDayPreferenceContext(signals) {
    return signals
        .filter(signal => signal.type === 'TIME_OF_DAY_PREFERENCE')
        .map(signal => ({
        id: signal.id,
        payload: signal.payload,
        createdAt: signal.createdAt
    }));
}
export function buildWorkHoursContext(signals) {
    return signals
        .filter(signal => signal.type === 'WORK_HOURS')
        .map(signal => ({
        id: signal.id,
        payload: signal.payload,
        createdAt: signal.createdAt
    }));
}
export function buildRecentMeetingsContext(createdMeetings, acceptedMeetings, daysBack = 30) {
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
        targetUserIds: m.targetUserIds,
        acceptedUserId: m.acceptedUserId,
        createdAt: m.createdAt,
        role: 'creator'
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
        targetUserIds: m.targetUserIds,
        createdByUserId: m.userFromId,
        createdAt: m.createdAt,
        role: 'acceptor'
    }));
    const allRecentMeetings = [...recentCreatedMeetings, ...recentAcceptedMeetings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
        total: allRecentMeetings.length,
        meetings: allRecentMeetings
    };
}
//# sourceMappingURL=context-helper.js.map