import type { Request, Response } from 'express';
export declare const handleCreateMeeting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleGetMeetings: (req: Request, res: Response) => Promise<void>;
export declare const handleCancelMeeting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=meeting-handler.d.ts.map