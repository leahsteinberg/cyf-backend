import { createMeeting, deleteMeetingAndOffers } from "../backend/update/meeting-update.js";
import { getCreatedMeetings, getAcceptedMeetings, getMeetingById } from "../backend/query/meeting-lookup.js";
import { processOffersForNewMeeting } from "../backend/process-meeting.js";
import type { Request, Response } from 'express';
import { ACCEPTED_MEETING_STATE, CANCELED_MEETING_STATE, DISMISSED_DRAFT_MEETING_STATE, EXPIRED_MEETING_STATE, getEffectiveTargetType, getEffectiveTimeType, IMMEDIATE_TIME_TYPE, OPEN_TARGET_TYPE, PAST_MEETING_STATE, REJECTED_MEETING_STATE, SEARCHING_MEETING_STATE, SYSTEM_ACTOR_ROLE, SYSTEM_REAL_TIME_SOURCE_TYPE } from "../types.js";
import { unacceptMeetingByAcceptor } from "../backend/meeting.js";
import { findMeetingTimeConflict } from "../backend/meeting-conflict.js";
import { transitionMeeting } from "../backend/transition-meeting.js";
import { getMeetingOffers, setOffersExpired } from "../backend/offer.js";
import { getIsBroadcasting } from "../backend/query/user-lookup.js";
import { setIsBroadcasting, setIsNotBroadcasting } from "../backend/update/user-update.js";


export const handleCreateMeeting = async (req: Request, res: Response) => {
  const {
    userFromId,
    scheduledEnd,
    scheduledFor,
    title,
    // OLD API (deprecated)
    meetingType,
    // NEW API (preferred)
    timeType,
    targetType,
    sourceType,
    intentLabel,
    targetUserId
  } = req.body;

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
      targetUserId: targetUserId || undefined
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

  // Check for broadcast meetings
  const broadcastMeetings = allMeetings.filter(m => {
    const timeType = getEffectiveTimeType(m);
    const targetType = getEffectiveTargetType(m);
    return timeType === IMMEDIATE_TIME_TYPE && targetType === OPEN_TARGET_TYPE;
  });

  const invalidBroadcasts = broadcastMeetings.filter(m =>
    m.meetingState === PAST_MEETING_STATE ||
    m.meetingState === EXPIRED_MEETING_STATE ||
    m.meetingState === CANCELED_MEETING_STATE
  );

  const validBroadcasts = broadcastMeetings.filter(m =>
    m.meetingState === SEARCHING_MEETING_STATE ||
    m.meetingState === ACCEPTED_MEETING_STATE ||
    m.meetingState === REJECTED_MEETING_STATE
  );

  // If there are invalid broadcasts but no valid ones, set isBroadcasting to false
  if (invalidBroadcasts.length > 0 && validBroadcasts.length === 0) {
    await setIsNotBroadcasting({userId: userFromId});
  }

  // Filter out invalid broadcasts and dismissed drafts
  const filteredMeetings = allMeetings.filter(m => {
    if (m.meetingState === DISMISSED_DRAFT_MEETING_STATE) return false;

    const timeType = getEffectiveTimeType(m);
    const targetType = getEffectiveTargetType(m);
    const isBroadcast = timeType === IMMEDIATE_TIME_TYPE && targetType === OPEN_TARGET_TYPE;

    if (isBroadcast && (
      m.meetingState === PAST_MEETING_STATE ||
      m.meetingState === EXPIRED_MEETING_STATE ||
      m.meetingState === CANCELED_MEETING_STATE
    )) {
      return false;
    }

    return true;
  });

  res.json(filteredMeetings)
}



export const handleCancelMeeting = async (req: Request, res: Response) => {
  const { meetingId, userId } = req.body;
  console.log("handle cancel meeting ---", meetingId);

  if (!meetingId) {
    return res.status(400).json({ error: "meetingId is required" });
  }
  try {
    const {meeting, events} = await transitionMeeting({meetingId, toState: CANCELED_MEETING_STATE, actorId: userId});
    console.log("did transition- ", meeting);
    if (meeting) {
      const offers = await getMeetingOffers({meetingId});
      await setOffersExpired(offers);
    }

    const isBroadcastMeeting = getEffectiveTimeType(meeting) === IMMEDIATE_TIME_TYPE && getEffectiveTargetType(meeting) === OPEN_TARGET_TYPE;
    const isAcceptor = userId === meeting.acceptedUserId;
    const isInitiatorBroadcasting = await getIsBroadcasting({ userId: meeting.userFromId });
    /// if someone accepts a broadcast meeting then cancels it,
    // need to re-spawn 
    // a broadcast meeting for the original user so they stay broadcasting
    // this is a special case that I should consider refactoring in the fugture.
    if (isBroadcastMeeting && isInitiatorBroadcasting ) {
      if (isAcceptor) {
        console.log("acceptor is canceling broadcast meeting");
        // the canceling party is NOT the broadcaster
        // therefore they should not affect the broadcast
        await createMeeting({
          userFromId: meeting.userFromId,
          scheduledEnd: meeting.scheduledEnd,
          scheduledFor: meeting.scheduledFor,
          title: meeting.title || '',
          meetingType: 'BROADCAST',
          meetingState: SEARCHING_MEETING_STATE,
          timeType: IMMEDIATE_TIME_TYPE,
          targetType: OPEN_TARGET_TYPE,
          sourceType: SYSTEM_REAL_TIME_SOURCE_TYPE,
        });
        await setIsBroadcasting({userId: meeting.userFromId});

      } else {
        // the canceling party in this case is the person who started the broadcast
        // therefore, they are opting to end the broadcast
        console.log("they are opting to end the broadcast");
        await setIsNotBroadcasting({userId: meeting.userFromId});
    }
  }
  res.json(meeting)


  } catch (error) {
    console.error("Error canceling meeting:", error);
    res.status(500).json({ error: "Internal server error while canceling meeting" });

  }
};
