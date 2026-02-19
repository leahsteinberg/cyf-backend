import { getFriendIds } from './friendship.js';
import { getGroupById, getGroupsByOwner } from './query/group-lookup.js';
import { createGroup, addGroupMember, removeGroupMember, deleteGroup } from './update/group-update.js';
import type { FriendGroup } from '../types.js';

export const createFriendGroup = async ({ name, ownerId, memberIds = [] }: {
    name: string;
    ownerId: string;
    memberIds?: string[];
}): Promise<FriendGroup> => {
    if (!name.trim()) {
        throw new Error("Group name cannot be empty");
    }

    if (memberIds.length > 0) {
        const friendIds = await getFriendIds(ownerId);
        const nonFriends = memberIds.filter(id => !friendIds.includes(id));
        if (nonFriends.length > 0) {
            throw new Error("You can only add friends to a group");
        }
    }

    return createGroup({ name: name.trim(), ownerId, memberIds });
};

export const getMyGroups = async ({ userId }: { userId: string }): Promise<FriendGroup[]> => {
    return getGroupsByOwner({ ownerId: userId });
};

export const addMemberToGroup = async ({ groupId, userId, requesterId }: {
    groupId: string;
    userId: string;
    requesterId: string;
}): Promise<void> => {
    const group = await getGroupById({ groupId });
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== requesterId) throw new Error("Only the group owner can add members");

    const friendIds = await getFriendIds(requesterId);
    if (!friendIds.includes(userId)) throw new Error("You can only add friends to a group");

    const alreadyMember = group.members.some(m => m.userId === userId);
    if (alreadyMember) throw new Error("User is already a member of this group");

    await addGroupMember({ groupId, userId });
};

export const removeMemberFromGroup = async ({ groupId, userId, requesterId }: {
    groupId: string;
    userId: string;
    requesterId: string;
}): Promise<void> => {
    const group = await getGroupById({ groupId });
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== requesterId) throw new Error("Only the group owner can remove members");

    await removeGroupMember({ groupId, userId });
};

export const deleteFriendGroup = async ({ groupId, requesterId }: {
    groupId: string;
    requesterId: string;
}): Promise<void> => {
    const group = await getGroupById({ groupId });
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== requesterId) throw new Error("Only the group owner can delete a group");

    await deleteGroup({ groupId });
};

/**
 * Resolves a group into the data needed to create a GROUP meeting.
 * Validates ownership and that the group is non-empty.
 */
export const resolveGroupForMeeting = async ({ groupId, requesterId }: {
    groupId: string;
    requesterId: string;
}): Promise<{ memberIds: string[]; groupName: string }> => {
    const group = await getGroupById({ groupId });
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== requesterId) throw new Error("You can only schedule meetings for your own groups");
    if (group.members.length === 0) throw new Error("Cannot schedule a meeting for an empty group");

    return {
        memberIds: group.members.map(m => m.userId),
        groupName: group.name,
    };
};
