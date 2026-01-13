import { logEvent } from "./event-tracking.js";

/**
 * Event type definitions for call tracking
 * These provide type safety for the metadata stored in UserEvent
 */

export type CallStartedMetadata = {
  meetingId: string;
  participantId?: string; // The other user in the call
  callType?: 'video' | 'audio';
  timestamp: string;
};

export type CallEndedMetadata = {
  meetingId: string;
  participantId?: string;
  duration?: number; // Duration in seconds
  endReason?: 'completed' | 'error' | 'user_hangup' | 'timeout';
  timestamp: string;
};

export type CallErrorMetadata = {
  meetingId: string;
  participantId?: string;
  errorType: string;
  errorMessage?: string;
  timestamp: string;
};

/**
 * Log when a user starts a call
 */
export const logCallStarted = async (
  userId: string,
  metadata: CallStartedMetadata
) => {
  return logEvent({
    userId,
    eventType: 'call_started',
    metadata,
  });
};

/**
 * Log when a user ends a call
 */
export const logCallEnded = async (
  userId: string,
  metadata: CallEndedMetadata
) => {
  return logEvent({
    userId,
    eventType: 'call_ended',
    metadata,
  });
};

/**
 * Log when a call encounters an error
 */
export const logCallError = async (
  userId: string,
  metadata: CallErrorMetadata
) => {
  return logEvent({
    userId,
    eventType: 'call_error',
    metadata,
  });
};

/**
 * Convenience function to log both start and end for testing
 */
export const logFullCall = async (
  userId: string,
  {
    meetingId,
    participantId,
    callType = 'video',
    duration,
    endReason = 'completed',
  }: {
    meetingId: string;
    participantId?: string;
    callType?: 'video' | 'audio';
    duration: number;
    endReason?: 'completed' | 'error' | 'user_hangup' | 'timeout';
  }
) => {
  const timestamp = new Date().toISOString();

  await logCallStarted(userId, {
    meetingId,
    participantId,
    callType,
    timestamp,
  });

  await logCallEnded(userId, {
    meetingId,
    participantId,
    duration,
    endReason,
    timestamp,
  });
};
