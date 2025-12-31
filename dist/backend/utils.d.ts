import { type TargetType } from "../types.js";
export declare const isTimePast: ({ eventTime }: {
    eventTime: Date;
}) => Promise<boolean>;
export declare const minutesUntil: ({ eventTime }: {
    eventTime: Date;
}) => Promise<number>;
export declare const minutesSince: ({ eventTime }: {
    eventTime: Date;
}) => Promise<number>;
export declare const minutesBetween: ({ earlierTime, laterTime }: {
    earlierTime: Date;
    laterTime: Date;
}) => Promise<number>;
export declare const addHour: (date: Date) => Date;
/**
 * Generates a relative date string for push notifications
 * Uses user's timezone for accurate day comparisons
 */
export declare const getRelativeDateString: (meetingTime: Date, timezone: string | null) => string;
export declare const determineTargetType: (targetUserIds: string[]) => TargetType;
//# sourceMappingURL=utils.d.ts.map