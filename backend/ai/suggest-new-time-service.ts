import { SuggestNewTimeResponseSchema, type SuggestNewTimeResponse } from './suggestion-schema.js';
import { callAI } from './ai-client.js';
import { formatContextForPrompt } from './ai-context.js';
import { buildSuggestionContext } from '../signal-context.js';
import type { Meeting } from '../../types.js';

export type TimeModifier = 'tomorrow' | 'later_today' | 'next_week';

const SYSTEM_PROMPT = `You are a meeting rescheduling assistant for a social calling app.

Your job is to suggest a new time for an existing meeting based on:
- The original meeting details (who it's with, what it was about)
- A time modifier constraint (tomorrow, later today, or next week)
- User signals (walking patterns, call intents, time preferences)
- The current time and user timezone

Rules:
1. The suggested time MUST satisfy the modifier constraint:
   - "tomorrow": Pick a time tomorrow during reasonable hours (9am-9pm in user's timezone)
   - "later_today": Pick a time later today (at least 1 hour from now, before midnight)
   - "next_week": Pick a time next week (Monday-Sunday of the following week)
2. Prefer times that match user's patterns (e.g., walking time, preferred hours)
3. Avoid times that conflict with work hours signals
4. The meeting duration should match the original meeting's duration
5. All times must be in ISO 8601 format
6. NEVER suggest a time at or before the current time
7. Keep the reason SHORT and friendly (max 1 sentence)
8. Never mention "AI" or "algorithm" in the reason`;

export async function suggestNewTime(
  meeting: Meeting,
  modifier: TimeModifier,
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
