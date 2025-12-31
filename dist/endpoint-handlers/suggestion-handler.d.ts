import type { Request, Response } from 'express';
export declare const handleAcceptSuggestion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleDismissSuggestion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleCreateSuggestion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const handleCreateSampleSuggestion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=suggestion-handler.d.ts.map