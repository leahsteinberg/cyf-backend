import { createMeeting } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings, getMeetingById, enrichMeetingsWithAcceptedUsers, enrichMeetingsWithTargetUsers } from "../backend/query/meeting-lookup.js";
import { processOffersForNewMeeting } from "../backend/process-meeting.js";
import { respawnMeeting } from "../backend/respawn-meeting.js";
import type { Request, Response } from 'express';
import { CANCELED_MEETING_STATE, DISMISSED_DRAFT_MEETING_STATE, REJECTED_OFFER_STATE } from "../types.js";
import { findMeetingTimeConflict } from "../backend/meeting-conflict.js";
import { transitionMeeting } from "../backend/transition-meeting.js";
import { getMeetingOffers, setOffersExpired } from "../backend/offer.js";
import { filterAndCleanMeetings } from "../backend/meeting-staleness.js";


export const handleCreateMeeting = async (req: Request, res: Response) => {
  const {
    userFromId,
    scheduledEnd,
    scheduledFor,
    title,
    // OLD API (deprecated)
    meetingType,
    targetUserId,  // OLD: single user ID (deprecated)
    // NEW API (preferred)
    timeType,
    targetType,
    sourceType,
    intentLabel,
    targetUserIds  // NEW: array of user IDs
  } = req.body;
  console.log("in createMeeting, got target user ids", targetUserIds)

  try {


    // Check if user already has any active meetings (created or accepted) that overlap with the requested time
    const createdMeetings = await getCreatedMeetings({userFromId});
    const acceptedMeetings = await getAcceptedMeetings({acceptedUserId: userFromId});

    // Use centralized conflict checking logic
    const conflict = findMeetingTimeConflict({
      userCreatedMeetings: createdMeetings,
      userAcceptedMeetings: acceptedMeetings,
      scheduledFor: new Date(scheduledFor),
      scheduledEnd: new Date(scheduledEnd)
    });

    if (conflict) {
      const errorMessage = conflict.type === 'created'
        ? "You already have a meeting you created at this time"
        : "You already have a meeting you accepted at this time";
      return res.status(409).json({
        error: errorMessage,
        existingMeeting: conflict.conflictingMeeting
      });
    }

    // Create meeting with dual-write support (old or new API)
    const meeting = await createMeeting({
      userFromId,
      scheduledEnd,
      scheduledFor,
      title,
      // Support both old and new API
      meetingType: meetingType || undefined,
      timeType: timeType || undefined,
      targetType: targetType || undefined,
      sourceType: sourceType || undefined,
      intentLabel: intentLabel || undefined,
      // Handle both old (targetUserId: string) and new (targetUserIds: string[]) formats
      targetUserIds: targetUserIds || (targetUserId ? [targetUserId] : undefined)
    });

    // Validate meeting was created successfully
    if (!meeting || !meeting.id) {
      return res.status(500).json({ error: "Failed to create meeting" });
    }

    await processOffersForNewMeeting(meeting);// TODO - Can I remove this and reuse code instead?
    res.json(meeting)
  } catch (error) {
    console.error("Error creating meeting:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Failed to create meeting", details: errorMessage });
  }
}

export const handleGetMeetings = async (req: Request, res: Response) => {
  const {userFromId} = req.body;
  const meetings = await getCreatedMeetings({userFromId});
  const acceptedMeetings = await getAcceptedMeetings({acceptedUserId: userFromId});

  const allMeetings = [...meetings, ...acceptedMeetings];

  // Filter out dismissed drafts
  const withoutDismissed = allMeetings.filter(m => m.meetingState !== DISMISSED_DRAFT_MEETING_STATE);

  // Use centralized filtering to hide terminal states and stale meetings
  // transitionStale = true to opportunistically transition stale meetings to PAST
  const filteredMeetings = await filterAndCleanMeetings(withoutDismissed, true);

  // Enrich meetings with acceptedUsers and targetUsers arrays
  const meetingsWithAcceptedUsers = await enrichMeetingsWithAcceptedUsers(filteredMeetings);
  const enrichedMeetings = await enrichMeetingsWithTargetUsers(meetingsWithAcceptedUsers);

  res.json(enrichedMeetings)
}



export const handleCancelMeeting = async (req: Request, res: Response) => {
  const { meetingId, userId } = req.body;
  console.log("handle cancel meeting ---", meetingId);

  if (!meetingId) {
    return res.status(400).json({ error: "meetingId is required" });
  }

  try {
    // Transition meeting to CANCELED state
    const {meeting, events} = await transitionMeeting({
      meetingId,
      toState: CANCELED_MEETING_STATE,
      actorId: userId
    });
    console.log("Meeting transitioned to CANCELED:", meeting);

    // Expire all offers for this meeting
    const offers = await getMeetingOffers({meetingId});
    await setOffersExpired(offers);

    // Determine who cancelled
    const isCreator = meeting.userFromId === userId;
    const isAcceptor = meeting.acceptedUserIds?.includes(userId) || false;

    console.log("Cancel context:", {
      isCreator,
      isAcceptor,
      meetingType: meeting.timeType || meeting.meetingType
    });

    if (isAcceptor) {
      // ACCEPTOR CANCELS: Respawn for ALL meeting types
      // Suppress notifications for the canceller and anyone who already rejected
      const rejectorIds = offers
        .filter(o => o.offerState === REJECTED_OFFER_STATE)
        .map(o => o.userOfferedId);
      const suppressNotificationUserIds = [...new Set([userId, ...rejectorIds])];

      console.log("Acceptor cancelled - respawning meeting, suppressing notifications for:", suppressNotificationUserIds);
      await respawnMeeting(meeting, suppressNotificationUserIds);

      const [enrichedMeeting] = await enrichMeetingsWithAcceptedUsers([meeting]);
      return res.json(enrichedMeeting);

    } else if (isCreator) {
      // CREATOR CANCELS: Full cancellation, no respawn
      console.log("Creator cancelled - full cancellation");

      const [enrichedMeeting] = await enrichMeetingsWithAcceptedUsers([meeting]);
      return res.json(enrichedMeeting);
    }

    // Fallback: neither creator nor acceptor (system cancellation?)
    const [enrichedMeeting] = await enrichMeetingsWithAcceptedUsers([meeting]);
    res.json(enrichedMeeting);

  } catch (error) {
    console.error("Error canceling meeting:", error);
    res.status(500).json({ error: "Internal server error while canceling meeting" });
  }
};
