import type { Meeting, Offer } from "../types.js";
type ValidationResult = {
    valid: true;
    offer: Offer;
    meeting: Meeting;
} | {
    valid: false;
    error: string;
    statusCode: number;
};
export declare const validateBroadcastRequest: ({ userId, offerId }: {
    userId: string;
    offerId: string;
}) => Promise<ValidationResult>;
export declare const processNewBroadcastMeeting: ({ meeting }: {
    meeting: Meeting;
}) => Promise<Meeting>;
export declare const tryAcceptUnclaimedBroadcast: ({ meeting, offerId }: {
    meeting: Meeting;
    offerId: string;
}) => Promise<{
    id: string;
    meetingId: string;
    subState: import("../generated/prisma/index.js").$Enums.BroadcastSubState;
    pendingAt: Date | null;
    offerClaimedId: string | null;
}>;
export declare const tryAcceptClaimedBroadcast: ({ meeting }: {
    meeting: Meeting;
}) => Promise<void>;
export declare const cancelClaimedBroadcast: ({ meeting }: {
    meeting: Meeting;
}) => Promise<void>;
export {};
//# sourceMappingURL=process-broadcast.d.ts.map