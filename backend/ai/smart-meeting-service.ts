import { SuggestNewTimeResponseSchema } from './suggestion-schema.js';
import { callAI } from './ai-client.js';
import { formatContextForPrompt } from './ai-context.js';
import { buildSuggestionContext } from '../signal-context.js';

const SUGGEST_TIME_SYSTEM_PROMPT = `You are a scheduling assistant helping coordinate phone calls between friends.
Suggest the best time in the next 7 days to call the specified friend(s).

Rules:
- All times MUST include UTC offset (e.g., "-08:00"), NEVER use "Z"
- Time must be at least 15 minutes in the future
- Keep the reason SHORT and friendly (max 1 sentence)
- Default call duration: 30 minutes unless context suggests otherwise
- Never mention "AI" or "algorithm"
- Respond with JSON only`;

/**
 * Given a user and one or more friend IDs, asks the AI to pick the best time
 * to call. Reuses the same context-building and AI plumbing as the suggestion
 * system — no extra API calls beyond what already exists.
 */
export async function suggestTimeForFriends({
    userId,
    friendIds,
}: {
    userId: string;
    friendIds: string[];
}): Promise<{ scheduledFor: Date; scheduledEnd: Date; reason: string } | null> {
    const context = await buildSuggestionContext(userId);
    const formattedContext = formatContextForPrompt(context);

    const targetFriends = context.friends.filter(f => friendIds.includes(f.id));
    const friendNames = targetFriends
        .map(f => f.displayUsername || f.username || f.name || 'your friend')
        .join(', ');

    const userPrompt = `${formattedContext}

Suggest the best time in the next 7 days to call: ${friendNames}

Respond with JSON: { "suggestedTime": { "startsAt": "ISO with offset", "endsAt": "ISO with offset" }, "timezone": "IANA name", "reason": "short reason" }`;

    const result = await callAI(SUGGEST_TIME_SYSTEM_PROMPT, userPrompt, SuggestNewTimeResponseSchema);
    if (!result) return null;

    const scheduledFor = new Date(result.suggestedTime.startsAt);
    const scheduledEnd = new Date(result.suggestedTime.endsAt);
    const minTime = new Date(Date.now() + 15 * 60 * 1000);
    if (scheduledFor <= minTime) return null;

    return {
        scheduledFor,
        scheduledEnd,
        reason: result.reason ?? `Good time to catch up with ${friendNames}`,
    };
}
