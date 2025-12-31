import { createMeeting } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings, getMeetingById, enrichMeetingsWithAcceptedUsers } from "../backend/query/meeting-lookup.js";
import { processOffersForNewMeeting } from "../backend/process-meeting.js";
import { respawnMeeting } from "../backend/respawn-meeting.js";
import type { Request, Response } from 'express';
import { ACCEPTED_MEETING_STATE, CANCELED_MEETING_STATE, DISMISSED_DRAFT_MEETING_STATE, EXPIRED_MEETING_STATE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE, isBroadcastMeeting, isOpenBroadcast } from "../types.js";
import { findMeetingTimeConflict } from "../backend/meeting-conflict.js";
import { transitionMeeting } from "../backend/transition-meeting.js";
import { getMeetingOffers, setOffersExpired } from "../backend/offer.js";
import { setIsNotBroadcasting } from "../backend/update/user-update.js";


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

  // Check for OPEN broadcast meetings (broadcasting to all friends)
  // isBroadcasting flag is specifically for OPEN broadcasts, not targeted broadcasts
  const openBroadcastMeetings = allMeetings.filter(m => isOpenBroadcast(m));

  const invalidOpenBroadcasts = openBroadcastMeetings.filter(m =>
    m.meetingState === PAST_MEETING_STATE ||
    m.meetingState === EXPIRED_MEETING_STATE ||
    m.meetingState === CANCELED_MEETING_STATE
  );

  const validOpenBroadcasts = openBroadcastMeetings.filter(m =>
    m.meetingState === SEARCHING_MEETING_STATE ||
    m.meetingState === ACCEPTED_MEETING_STATE ||
    m.meetingState === REJECTED_MEETING_STATE
  );

  // If there are invalid OPEN broadcasts but no valid ones, set isBroadcasting to false
  if (invalidOpenBroadcasts.length > 0 && validOpenBroadcasts.length === 0) {
    await setIsNotBroadcasting({userId: userFromId});
  }

  // Filter out ALL invalid broadcasts (both OPEN and targeted) and dismissed drafts
  const filteredMeetings = allMeetings.filter(m => {
    if (m.meetingState === DISMISSED_DRAFT_MEETING_STATE) return false;

    // Hide invalid broadcasts (any IMMEDIATE meeting, not just OPEN)
    if (isBroadcastMeeting(m) && (
      m.meetingState === PAST_MEETING_STATE ||
      m.meetingState === EXPIRED_MEETING_STATE ||
      m.meetingState === CANCELED_MEETING_STATE
    )) {
      return false;
    }

    return true;
  });

  // Enrich meetings with acceptedUsers array
  const enrichedMeetings = await enrichMeetingsWithAcceptedUsers(filteredMeetings);

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
      // This returns the meeting to circulation, giving the creator and all recipients (including canceller) another chance
      console.log("Acceptor cancelled - respawning meeting");
      await respawnMeeting(meeting);

      const [enrichedMeeting] = await enrichMeetingsWithAcceptedUsers([meeting]);
      return res.json(enrichedMeeting);

    } else if (isCreator) {
      // CREATOR CANCELS: Full cancellation, no respawn
      console.log("Creator cancelled - full cancellation");

      // Clear isBroadcasting flag ONLY for OPEN broadcasts
      if (isOpenBroadcast(meeting)) {
        await setIsNotBroadcasting({userId: meeting.userFromId});
      }

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
