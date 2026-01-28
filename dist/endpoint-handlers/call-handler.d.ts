import type { Request, Response } from 'express';
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
export declare const handleCallStart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
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
export declare const handleCallEnd: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
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
export declare const handleCallError: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=call-handler.d.ts.map