import { type AISuggestedMeeting } from './suggestion-schema.js';
import type { Meeting } from '../../types.js';
export declare function generateSuggestions(userId: string): Promise<AISuggestedMeeting[]>;
export declare function createMeetingFromSuggestion(userId: string, suggestion: AISuggestedMeeting): Promise<Meeting>;
//# sourceMappingURL=suggestion-service.d.ts.map