export declare const OPEN_OFFER_STATE = "OPEN";
export declare const ACCEPTED_OFFER_STATE = "ACCEPTED";
export declare const REJECTED_OFFER_STATE = "REJECTED";
export declare const EXPIRED_OFFER_STATE = "EXPIRED";
export declare const ACCEPTED_MEETING_STATE = "ACCEPTED";
export declare const SEARCHING_MEETING_STATE = "SEARCHING";
export declare const REJECTED_MEETING_STATE = "REJECTED";
export declare const PAST_MEETING_STATE = "PAST";
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
//# sourceMappingURL=utils.d.ts.map