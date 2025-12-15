import { CLAIMED_BROADCAST_STATE, PENDING_CLAIMED_BROADCAST_STATE, UNCLAIMED_BROADCAST_STATE, type BroadcastMetadata, type BroadcastSubState } from "../../types.js";
import { prisma } from "../auth.js";

export const setBroadcastPending = async ({meetingId, offerClaimedId}: {meetingId: string, offerClaimedId: string}) => {
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


export const setBroadcastClaimed = async ({meetingId, offerClaimedId}: {meetingId: string, offerClaimedId: string}) => {
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


export const setBroadcastUnclaimed = async ({meetingId}: {meetingId: string}) => {
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


export const setBroadcastSubState = async ({meetingId, subState}: {meetingId: string, subState: BroadcastSubState}): Promise<BroadcastMetadata> => {
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