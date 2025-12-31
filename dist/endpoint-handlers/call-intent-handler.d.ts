import type { Request, Response } from 'express';
/**
 * Creates a call intent (DRAFT meeting with UNKNOWN time and FRIEND_SPECIFIC target)
 * scheduledFor is set to 4 days in the future as a defacto expiry timestamp
 */
export declare const handleCallIntent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Removes a call intent (deletes the DRAFT meeting)
 */
export declare const handleUndoCallIntent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=call-intent-handler.d.ts.map