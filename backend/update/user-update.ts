import { prisma } from "../auth.js";

export const updateUserAvatarUrl = async ({ userId, avatarUrl }: { userId: string; avatarUrl: string }) => {
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
    });
    return updatedUser;
};

export const updateUserPushToken = async ({ userId, pushToken, timezone }: { userId: string, pushToken: string, timezone?: string }) => {
    const updatedUser = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            pushToken: pushToken,
            ...(timezone && { timezone })
        }
    });
    console.log("Updated user push token:", updatedUser);
    return updatedUser;
};

/**
 * DEPRECATED: isBroadcasting is now computed dynamically from meetings.
 * This function is a no-op and will be removed in a future update.
 *
 * @param userId - ID of the user
 */
export const setIsBroadcasting = async ({ userId }: { userId: string }) => {
    // DEPRECATED: isBroadcasting is now computed dynamically
    return;
};

/**
 * DEPRECATED: isBroadcasting is now computed dynamically from meetings.
 * This function is a no-op and will be removed in a future update.
 *
 * @param userId - ID of the user
 */
export const setIsNotBroadcasting = async ({ userId }: { userId: string }) => {
    // DEPRECATED: isBroadcasting is now computed dynamically
    return;
};

export const deleteUser = async ({ userId }: { userId: string }): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        // Get IDs of all meetings the user created so we can clean up their children
        const userMeetings = await tx.meeting.findMany({
            where: { userFromId: userId },
            select: { id: true },
        });
        const userMeetingIds = userMeetings.map(m => m.id);

        // BroadcastMetadata for the user's meetings must go before offers,
        // because broadcast_metadata has a nullable FK to offer with no cascade.
        if (userMeetingIds.length > 0) {
            await tx.broadcastMetadata.deleteMany({
                where: { meetingId: { in: userMeetingIds } },
            });
        }

        // If this user's received offers are the claimed offer on someone else's broadcast,
        // null that reference out so we can delete the offer safely.
        await tx.broadcastMetadata.updateMany({
            where: { offerClaimed: { userOfferedId: userId } },
            data: { offerClaimedId: null },
        });

        // Delete all offers tied to this user's meetings, then offers they received
        if (userMeetingIds.length > 0) {
            await tx.offer.deleteMany({ where: { meetingId: { in: userMeetingIds } } });
        }
        await tx.offer.deleteMany({ where: { userOfferedId: userId } });

        // Delete the user's meetings (BroadcastMetadata already gone above)
        await tx.meeting.deleteMany({ where: { userFromId: userId } });

        // Remove user from meetings they were an accepted participant on.
        // Prisma has no array-pull primitive so we use raw SQL for the array column.
        await tx.$queryRaw`
            UPDATE meeting
            SET "acceptedUserIds" = array_remove("acceptedUserIds", ${userId}),
                "acceptedUserId"  = CASE WHEN "acceptedUserId" = ${userId} THEN NULL ELSE "acceptedUserId" END
            WHERE "acceptedUserId" = ${userId}
               OR ${userId} = ANY("acceptedUserIds")
        `;

        await tx.userSignal.deleteMany({ where: { userId } });

        await tx.friendship.deleteMany({
            where: { OR: [{ userId1: userId }, { userId2: userId }] },
        });

        await tx.invitation.deleteMany({ where: { userFromId: userId } });

        // Deleting owned groups cascades to GroupMember rows within those groups
        await tx.friendGroup.deleteMany({ where: { ownerId: userId } });

        // Deleting the user cascades: Session, Account, UserEvent, GroupMember (memberships in other groups)
        await tx.user.delete({ where: { id: userId } });
    });
};
