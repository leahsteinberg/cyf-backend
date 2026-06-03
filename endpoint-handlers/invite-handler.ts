import { createFriendship } from "../backend/update/friendship-update.js";
import { findUserByPhone, getUserPhoneNumber } from "../backend/query/user-lookup.js";
import { createUser } from "../backend/user.js";
import { validateUsername } from "../backend/username-validation.js";
import type { Request, Response } from 'express';
import { createInvite, deleteInvite } from "../backend/update/invite-update.js";
import { findInvite, getSentInvites, getFriendInvites } from "../backend/query/invite-lookup.js";


export const handleCreateInvite = async (req: Request, res: Response) => {
    const {userFromId, userToPhoneNumber} = req.body;
    console.log("create invite - got - ", {userFromId, userToPhoneNumber});
    const invitation = await createInvite({userFromId, userToPhoneNumber});
    res.send(invitation);// TODO - switch to res.json()?
};


export const handleInviteSignUp = async (req: Request, res: Response) => {
    const {token, email, phoneNumber, name, password, username} = req.body;
    console.log("/api/sign-up-accept-invite", {token, email, phoneNumber, name, password, username})

    const validation = validateUsername(username);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    const userTo = await findUserByPhone(phoneNumber);
    if (!userTo) {
      const invite = await findInvite(token, phoneNumber);
      if (invite && invite.userToPhoneNumber === phoneNumber) {
        const {userFromId} = invite;
        const newUser = await createUser({email, phoneNumber, name, password, username});
        const newFriendship = await createFriendship({userId1: userFromId, userId2: newUser.user.id})
        res.json(newUser);
      }
    }
  }

export const handleGetSentInvites = async(req: Request, res: Response) => {
    const {id} = req.body;
    const sentInvites = await getSentInvites({userFromId: id})
    res.json(sentInvites);// TODO - switch to res.json()?
  };

export const handleGetFriendInvites = async(req: Request, res: Response) => {
    const {id} = req.body;
    const phoneNumber = await getUserPhoneNumber({userId: id});

    if (!phoneNumber) {
        return res.status(404).json({ error: "User not found or phone number not set" });
    }

    const friendInvites = await getFriendInvites({userToPhoneNumber: phoneNumber});
    res.json(friendInvites);
};

export const handleRemoveInvite = async (req: Request, res: Response) => {
    const { inviteId } = req.body;
    console.log("/api/remove-invite", { inviteId });

    if (!inviteId) {
        return res.status(400).json({ error: "inviteId is required" });
    }

    try {
        await deleteInvite({ inviteId });
        res.json({ success: true });
    } catch (error) {
        console.error("Error removing invite:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};

export const handleAcceptInvite = async(req: Request, res: Response) => {
    const {userId, token} = req.body;
    console.log("/api/accept-invite", {userId, token});

    if (!userId || !token) {
        return res.status(400).json({ error: "userId and token are required" });
    }

    try {
        // Get user's phone number
        const phoneNumber = await getUserPhoneNumber({userId});
        if (!phoneNumber) {
            return res.status(404).json({ error: "User not found or phone number not set" });
        }

        // Find the invite
        const invite = await findInvite(token, phoneNumber);
        if (!invite) {
            return res.status(404).json({ error: "Invite not found or does not match user" });
        }

        // Create friendship
        const newFriendship = await createFriendship({
            userId1: invite.userFromId,
            userId2: userId
        });

        // Delete the invite now that it's been accepted
        await deleteInvite({inviteId: invite.id});

        res.json({
            success: true,
            friendship: newFriendship
        });
    } catch (error) {
        console.error("Error accepting invite:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: "Internal server error", details: errorMessage });
    }
};
