import { CLAIMED_BROADCAST_STATE, PENDING_CLAIMED_BROADCAST_STATE, UNCLAIMED_BROADCAST_STATE } from "../../types.js";
import { prisma } from "../auth.js";
export const setBroadcastPending = async ({ meetingId, offerClaimedId }) => {
    const updatedMetadata = await prisma.broadcastMetadata.update({
        where: {
            meetingId: meetingId,
        },
        data: {
            subState: PENDING_CLAIMED_BROADCAST_STATE,
            pendingAt: new Date(),
            offerClaimedId,
        }
    });
    return updatedMetadata;
};
export const setBroadcastClaimed = async ({ meetingId, offerClaimedId }) => {
    const updatedMetadata = await prisma.broadcastMetadata.update({
        where: {
            meetingId: meetingId,
        },
        data: {
            subState: CLAIMED_BROADCAST_STATE,
            pendingAt: null,
            offerClaimedId,
        }
    });
    return updatedMetadata;
};
export const setBroadcastUnclaimed = async ({ meetingId }) => {
    const updatedMetadata = await prisma.broadcastMetadata.update({
        where: {
            meetingId: meetingId,
        },
        data: {
            subState: UNCLAIMED_BROADCAST_STATE,
            pendingAt: null,
            offerClaimedId: null,
        }
    });
    return updatedMetadata;
};
export const setBroadcastSubState = async ({ meetingId, subState }) => {
    const updatedMetadata = await prisma.broadcastMetadata.update({
        where: {
            meetingId: meetingId,
        },
        data: {
            subState: subState,
        }
    });
    return updatedMetadata;
};
//# sourceMappingURL=broadcast-update.js.map