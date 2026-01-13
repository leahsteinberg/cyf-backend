import type { Request, Response } from 'express';
import { logCallStarted, logCallEnded, logCallError } from '../backend/update/call-tracking.js';

/**
 * POST /api/calls/start
 * Log when a user starts a call
 *
 * Body: {
 *   userId: string;
 *   meetingId: string;
 *   participantId?: string;
 *   callType?: 'video' | 'audio';
 * }
 */
export const handleCallStart = async (req: Request, res: Response) => {
  const { userId, meetingId, participantId, callType } = req.body;

  console.log("Logging call start:", { userId, meetingId, participantId, callType });

  if (!userId || !meetingId) {
    return res.status(400).json({
      error: "userId and meetingId are required"
    });
  }

  try {
    const event = await logCallStarted(userId, {
      meetingId,
      participantId,
      callType: callType || 'video',
      timestamp: new Date().toISOString(),
    });

    console.log("Call start logged:", {
      eventId: event?.id,
      userId,
      meetingId
    });

    res.json({
      success: true,
      eventId: event?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging call start:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Failed to log call start",
      details: errorMessage
    });
  }
};

/**
 * POST /api/calls/end
 * Log when a user ends a call
 *
 * Body: {
 *   userId: string;
 *   meetingId: string;
 *   participantId?: string;
 *   duration?: number; // Duration in seconds
 *   endReason?: 'completed' | 'error' | 'user_hangup' | 'timeout';
 * }
 */
export const handleCallEnd = async (req: Request, res: Response) => {
  const { userId, meetingId, participantId, duration, endReason } = req.body;

  console.log("Logging call end:", { userId, meetingId, participantId, duration, endReason });

  if (!userId || !meetingId) {
    return res.status(400).json({
      error: "userId and meetingId are required"
    });
  }

  try {
    const event = await logCallEnded(userId, {
      meetingId,
      participantId,
      duration,
      endReason: endReason || 'completed',
      timestamp: new Date().toISOString(),
    });

    console.log("Call end logged:", {
      eventId: event?.id,
      userId,
      meetingId,
      duration
    });

    res.json({
      success: true,
      eventId: event?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging call end:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Failed to log call end",
      details: errorMessage
    });
  }
};

/**
 * POST /api/calls/error
 * Log when a call encounters an error
 *
 * Body: {
 *   userId: string;
 *   meetingId: string;
 *   participantId?: string;
 *   errorType: string;
 *   errorMessage?: string;
 * }
 */
export const handleCallError = async (req: Request, res: Response) => {
  const { userId, meetingId, participantId, errorType, errorMessage } = req.body;

  console.log("Logging call error:", { userId, meetingId, participantId, errorType });

  if (!userId || !meetingId || !errorType) {
    return res.status(400).json({
      error: "userId, meetingId, and errorType are required"
    });
  }

  try {
    const event = await logCallError(userId, {
      meetingId,
      participantId,
      errorType,
      errorMessage,
      timestamp: new Date().toISOString(),
    });

    console.log("Call error logged:", {
      eventId: event?.id,
      userId,
      meetingId,
      errorType
    });

    res.json({
      success: true,
      eventId: event?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging call error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Failed to log call error",
      details: errorMessage
    });
  }
};
