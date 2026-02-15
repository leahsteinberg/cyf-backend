import { SuggestNewTimeResponseSchema, type SuggestNewTimeResponse } from './suggestion-schema.js';
import { callAI } from './ai-client.js';
import { formatContextForPrompt } from './ai-context.js';
import { buildSuggestionContext } from '../signal-context.js';
import type { Meeting } from '../../types.js';

const SYSTEM_PROMPT = `You are a meeting rescheduling assistant for a social calling app.

Your job is to suggest a new time for an existing meeting based on:
- The original meeting details (who it's with, what it was about)
- A user-provided time preference (e.g. "tomorrow", "later today", "next week", "this weekend", "Friday evening", etc.)
- User signals (walking patterns, call intents, time preferences)
- Friend availability and work hours
- The current time and user timezone

Rules:
1. The suggested time MUST follow the user's time preference as closely as possible
2. Interpret the preference naturally - e.g. "this weekend" means Saturday or Sunday, "Friday evening" means Friday after 5pm
3. Pick a time that has a good chance of working for all parties involved, considering their signals and availability patterns
4. Prefer times that match user's patterns (e.g., walking time, preferred hours)
5. Avoid times that conflict with work hours signals for any participant
6. The meeting duration should match the original meeting's duration
7. All times must be in ISO 8601 format
8. NEVER suggest a time at or before the current time
9. Keep the reason SHORT and friendly (max 1 sentence)
10. Never mention "AI" or "algorithm" in the reason`;

export async function suggestNewTime(
  meeting: Meeting,
  modifier: string,
  userId: string
): Promise<SuggestNewTimeResponse | null> {
  const context = await buildSuggestionContext(userId);
  const baseContext = formatContextForPrompt(context);

  const durationMs = new Date(meeting.scheduledEnd).getTime() - new Date(meeting.scheduledFor).getTime();
  const durationMinutes = Math.round(durationMs / (60 * 1000));

  const targetFriendNames = meeting.targetUserIds
    .map(id => context.friends.find(f => f.id === id)?.name || id)
    .join(', ');

  const userPrompt = `${baseContext}

## Original Meeting
- Title: ${meeting.title || 'Untitled'}
- Originally scheduled: ${new Date(meeting.scheduledFor).toISOString()} to ${new Date(meeting.scheduledEnd).toISOString()}
- Duration: ${durationMinutes} minutes
- With: ${targetFriendNames}
- Current state: ${meeting.meetingState}

## Time Modifier
The user wants to reschedule this meeting to: "${modifier}"

Suggest a new time that satisfies the "${modifier}" constraint. Return JSON matching this schema:
{
  "suggestedTime": {
    "startsAt": "ISO 8601 datetime",
    "endsAt": "ISO 8601 datetime"
  },
  "reason": "Short friendly reason for this time (optional)"
}

IMPORTANT: The suggested time MUST be in the future and MUST match the "${modifier}" constraint. Keep the same duration (${durationMinutes} minutes).`;

  const result = await callAI(SYSTEM_PROMPT, userPrompt, SuggestNewTimeResponseSchema);

  if (!result) {
    return null;
  }

  // Validate the suggested time is in the future
  const startsAt = new Date(result.suggestedTime.startsAt);
  const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
  if (startsAt <= fifteenMinutesFromNow) {
    console.warn('AI suggested a time too close to now for suggest-new-time, rejecting');
    return null;
  }

  return result;
}
