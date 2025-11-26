import type { BroadcastMetadata, BroadcastSubState } from "../../types.js";
import { prisma } from "../auth.js";

export const setBroadcastPending = async ({meetingId}: {meetingId: string}) => {
    const updatedMetadata = await prisma.broadcastMetadata.update({
        where: {
            meetingId: meetingId,
        },
        data: {
            subState: "PENDING_CLAIMED",
            pendingAt: new Date(),
        }
    });
    return updatedMetadata;
};


export const setBroadcastClaimed = async ({meetingId}: {meetingId: string}) => {
    const updatedMetadata = await prisma.broadcastMetadata.update({
        where: {
            meetingId: meetingId,
        },
        data: {
            subState: "CLAIMED",
            pendingAt: null,
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
            subState: "UNCLAIMED",
            pendingAt: null,
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