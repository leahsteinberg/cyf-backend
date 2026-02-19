import type { Request, Response } from 'express';
import {
    createFriendGroup,
    getMyGroups,
    addMemberToGroup,
    removeMemberFromGroup,
    deleteFriendGroup,
} from '../backend/group.js';

export const handleCreateGroup = async (req: Request, res: Response) => {
    const { userId, name, memberIds = [] } = req.body;

    if (!userId || !name) {
        return res.status(400).json({ error: "userId and name are required" });
    }

    try {
        const group = await createFriendGroup({ name, ownerId: userId, memberIds });
        res.json(group);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: message });
    }
};

export const handleGetGroups = async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const groups = await getMyGroups({ userId });
        res.json(groups);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: message });
    }
};

export const handleAddGroupMember = async (req: Request, res: Response) => {
    const { requesterId, groupId, userId } = req.body;

    if (!requesterId || !groupId || !userId) {
        return res.status(400).json({ error: "requesterId, groupId, and userId are required" });
    }

    try {
        await addMemberToGroup({ groupId, userId, requesterId });
        res.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: message });
    }
};

export const handleRemoveGroupMember = async (req: Request, res: Response) => {
    const { requesterId, groupId, userId } = req.body;

    if (!requesterId || !groupId || !userId) {
        return res.status(400).json({ error: "requesterId, groupId, and userId are required" });
    }

    try {
        await removeMemberFromGroup({ groupId, userId, requesterId });
        res.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: message });
    }
};

export const handleDeleteGroup = async (req: Request, res: Response) => {
    const { requesterId, groupId } = req.body;

    if (!requesterId || !groupId) {
        return res.status(400).json({ error: "requesterId and groupId are required" });
    }

    try {
        await deleteFriendGroup({ groupId, requesterId });
        res.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: message });
    }
};
