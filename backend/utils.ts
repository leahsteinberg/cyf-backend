export const OPEN_OFFER_STATE = 'OPEN';
export const ACCEPTED_OFFER_STATE = 'ACCEPTED';
export const REJECTED_OFFER_STATE = 'REJECTED';
export const EXPIRED_OFFER_STATE = 'EXPIRED';


export const ACCEPTED_MEETING_STATE = 'ACCEPTED';
export const SEARCHING_MEETING_STATE = 'SEARCHING';
export const REJECTED_MEETING_STATE = 'REJECTED';
export const PAST_MEETING_STATE = 'PAST';

export const isTimePast = async ({eventTime}: {eventTime: Date}): Promise<boolean> => {
    const now = new Date();
    return ((eventTime.getTime() - now.getTime()) <= 0);
};

export const minutesUntil = async ({eventTime}: {eventTime: Date}): Promise<number> => {
    const now = new Date();
    const timeBetween = eventTime.getTime() - now.getTime();
    // turn time between into number of minutes
    const minutesUntil = (timeBetween/1000)/60;
    return minutesUntil;
};

export const minutesSince = async({eventTime}: {eventTime: Date}): Promise<number> => {
    const now = new Date();
    const timeBetween = now.getTime() - eventTime.getTime();
    // turn time between into number of minutes
    const minutesSince = (timeBetween/1000)/60;
    return minutesSince;
};

export const minutesBetween = async({earlierTime, laterTime}: {earlierTime: Date, laterTime:Date}): Promise<number> => {
    const timeBetween = laterTime.getTime() - earlierTime.getTime();
    const minutes = (timeBetween/1000)/60;
    return minutes;
};

export const addHour = (date: Date): Date => {
    return new Date(date.getTime() + 60 * 60 * 1000);
};



/**
 * Generates a relative date string for push notifications
 * Uses user's timezone for accurate day comparisons
 */
const getRelativeDateString = (meetingTime: Date, timezone: string | null): string => {
    const now = new Date();

    // Use timezone if available, otherwise fall back to UTC
    const tz = timezone || 'UTC';

    // Get date parts in user's timezone
    const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const meetingInTz = new Date(meetingTime.toLocaleString('en-US', { timeZone: tz }));

    // Compare dates (ignoring time)
    const today = new Date(nowInTz.getFullYear(), nowInTz.getMonth(), nowInTz.getDate());
    const meetingDay = new Date(meetingInTz.getFullYear(), meetingInTz.getMonth(), meetingInTz.getDate());

    const diffDays = Math.round((meetingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays >= 2 && diffDays <= 6) {
        // Return day name (e.g., "Monday")
        return meetingTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz });
    }
    // For dates further out, use "Mon, Nov 17" format
    return meetingTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: tz
    });
};