import { AISuggestionResponseSchema, type AISuggestedMeeting } from './suggestion-schema.js';
import { callAI } from './ai-client.js';
import { formatContextForPrompt } from './ai-context.js';
import { buildSuggestionContext } from '../signal-context.js';
import { createDraftMeeting } from '../draft-meeting.js';
import type { Meeting } from '../../types.js';
import { FUTURE_TIME_TYPE, FRIEND_SPECIFIC_TARGET_TYPE, SYSTEM_PATTERN_SOURCE_TYPE } from '../../types.js';

// System prompt - the "personality" of your suggestion engine
const SYSTEM_PROMPT = `You are a meeting suggestion assistant for a social calling app.

Your job is to propose meeting times between friends based on:
- User signals (walking patterns, call intents, time preferences)
- Friend availability (who is broadcasting, recent interactions)
- Mutual interest (both parties want to call each other)
- Time context (current time, timezone)

Rules:
1. PRIORITIZE friends with mutual interest (both want to call each other)
2. Also consider friends the user has expressed intent to call
3. Prefer times that match user's patterns (e.g., walking time)
4. Keep reasons SHORT and friendly (max 1 sentence)
5. Never mention "AI" or "algorithm" in reasons
6. Confidence should reflect how well signals support the suggestion
7. If no good suggestions, return empty array - don't force bad ones
8. NEVER suggest meetings starting NOW or at the current time. All suggested meetings MUST be scheduled for the future (time.kind must be "FUTURE")
9. All suggestions must have a specific startsAt and endsAt time in the future
10. All times must be in ISO 8601 format WITH the UTC offset for the user's timezone (e.g. "2025-01-15T20:00:00-08:00" for 8pm PST). Never use "Z" suffix - always include the explicit UTC offset.
11. Include the "timezone" field in each suggestion with the IANA timezone name you used (e.g. "America/Los_Angeles")

Good reason examples:
- "You both want to catch up - how about later today?"
- "You usually walk around this time, and Alex is free"
- "You wanted to catch up with Sam this week"

Bad reason examples (don't do these):
- "Based on my analysis of your patterns..."
- "The algorithm suggests..."
- "Statistically optimal time..."`;

export async function generateSuggestions(userId: string): Promise<AISuggestedMeeting[]> {
  // 1. Build context
  const context = await buildSuggestionContext(userId);

  // 2. Format context for the prompt
  const baseContext = formatContextForPrompt(context);

  const userPrompt = `${baseContext}

Based on this context, suggest 1 possible meeting time. Return JSON matching this schema:
{
  "suggestions": [
    {
      "confidence": 0.8,
      "reason": "Short user-facing reason",
      "time": { "kind": "FUTURE", "startsAt": "ISO with offset (e.g. 2025-01-15T20:00:00-08:00)", "endsAt": "ISO with offset" },
      "target": { "kind": "FRIEND", "friendId": "uuid" },
      "timezone": "IANA timezone (e.g. America/Los_Angeles)",
      "metadata": { "signalTypesUsed": ["CALL_INTENT"], "tags": ["walk"] }
    }
  ],
  "reasoning": "Internal notes (optional)"
}

IMPORTANT:
- time.kind MUST be "FUTURE" with specific startsAt and endsAt times. Never use "NOW".
- Times MUST include the UTC offset for the user's timezone (e.g. -08:00 for PST). Do NOT use "Z".`;

  // 3. Call AI with shared client
  const result = await callAI(SYSTEM_PROMPT, userPrompt, AISuggestionResponseSchema);

  if (!result) {
    return [];
  }

  // 4. Additional business validation
  const validSuggestions = result.suggestions.filter(s =>
    validateSuggestion(s, context)
  );

  return validSuggestions;
}

function validateSuggestion(
  suggestion: AISuggestedMeeting,
  context: Awaited<ReturnType<typeof buildSuggestionContext>>
): boolean {
  // Reject NOW/IMMEDIATE suggestions - AI should never suggest broadcast meetings
  if (suggestion.time.kind === 'NOW') {
    console.warn('Filtered out NOW/IMMEDIATE suggestion - AI should only suggest FUTURE meetings');
    return false;
  }

  // Reject suggestions starting within 15 minutes of now (effectively "now" meetings)
  if (suggestion.time.startsAt) {
    const startsAt = new Date(suggestion.time.startsAt);
    const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
    if (startsAt <= fifteenMinutesFromNow) {
      console.warn('Filtered out suggestion starting too soon (within 15 minutes)');
      return false;
    }
  }

  // Ensure suggested friend exists in user's friend list
  const friendExists = context.friends.some(f => f.id === suggestion.target.friendId);
  if (!friendExists) {
    console.warn(`AI suggested non-friend: ${suggestion.target.friendId}`);
    return false;
  }

  // Ensure confidence is reasonable
  if (suggestion.confidence < 0.3) {
    console.warn('Low confidence suggestion filtered out');
    return false;
  }

  return true;
}

// Convert AI suggestion to DRAFT meeting
export async function createMeetingFromSuggestion(
  userId: string,
  suggestion: AISuggestedMeeting
): Promise<Meeting> {
  const scheduledFor = new Date(suggestion.time.startsAt!);
  const scheduledEnd = new Date(suggestion.time.endsAt!);

  return createDraftMeeting({
    userFromId: userId,
    scheduledFor,
    scheduledEnd,
    title: 'Suggested phone call',
    timeType: FUTURE_TIME_TYPE,
    targetType: FRIEND_SPECIFIC_TARGET_TYPE,
    sourceType: SYSTEM_PATTERN_SOURCE_TYPE,
    targetUserIds: [suggestion.target.friendId],
    suggestionReason: suggestion.reason,
    minParticipants: 1,
    maxParticipants: 1,
  });
}
