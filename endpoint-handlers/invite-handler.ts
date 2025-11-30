import { createFriendship } from "../backend/update/friendship-update.js";
import { findUserByPhone, getUserPhoneNumber } from "../backend/query/user-lookup.js";
import { createUser } from "../backend/user.js";
import type { Request, Response } from 'express';
import { createInvite } from "../backend/update/invite-update.js";
import { findInvite, getSentInvites, getFriendInvites } from "../backend/query/invite-lookup.js";


export const handleCreateInvite = async (req: Request, res: Response) => {
    const {userFromId, userToPhoneNumber} = req.body;
    console.log("create invite - got - ", {userFromId, userToPhoneNumber});
    const invitation = await createInvite({userFromId, userToPhoneNumber});
    res.send(invitation);// TODO - switch to res.json()?
};


export const handleInviteSignUp = async (req: Request, res: Response) => {
    const {token, email, phoneNumber, name, password} = req.body;
    console.log("/api/sign-up-accept-invite", {token, email, phoneNumber, name, password})
    const userTo = await findUserByPhone(phoneNumber);
    if (!userTo) {
      const invite = await findInvite(token, phoneNumber);
      if (invite && invite.userToPhoneNumber === phoneNumber) {
        const {userFromId} = invite;
        const newUser = await createUser({email, phoneNumber, name, password});
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
