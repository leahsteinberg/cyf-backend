import type { Request, Response } from 'express';
export declare const handleCreateInvite: (req: Request, res: Response) => Promise<void>;
export declare const handleInviteSignUp: (req: Request, res: Response) => Promise<void>;
export declare const handleGetSentInvites: (req: Request, res: Response) => Promise<void>;
export declare const handleGetFriendInvites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleAcceptInvite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=invite-handler.d.ts.map