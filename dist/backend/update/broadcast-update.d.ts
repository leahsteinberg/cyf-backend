import { type BroadcastMetadata, type BroadcastSubState } from "../../types.js";
export declare const setBroadcastPending: ({ meetingId, offerClaimedId }: {
    meetingId: string;
    offerClaimedId: string;
}) => Promise<{
    id: string;
    meetingId: string;
    subState: import("../../generated/prisma/index.js").$Enums.BroadcastSubState;
    pendingAt: Date | null;
    offerClaimedId: string | null;
}>;
export declare const setBroadcastClaimed: ({ meetingId, offerClaimedId }: {
    meetingId: string;
    offerClaimedId: string;
}) => Promise<{
    id: string;
    meetingId: string;
    subState: import("../../generated/prisma/index.js").$Enums.BroadcastSubState;
    pendingAt: Date | null;
    offerClaimedId: string | null;
}>;
export declare const setBroadcastUnclaimed: ({ meetingId }: {
    meetingId: string;
}) => Promise<{
    id: string;
    meetingId: string;
    subState: import("../../generated/prisma/index.js").$Enums.BroadcastSubState;
    pendingAt: Date | null;
    offerClaimedId: string | null;
}>;
export declare const setBroadcastSubState: ({ meetingId, subState }: {
    meetingId: string;
    subState: BroadcastSubState;
}) => Promise<BroadcastMetadata>;
//# sourceMappingURL=broadcast-update.d.ts.map