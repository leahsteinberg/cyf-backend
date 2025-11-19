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