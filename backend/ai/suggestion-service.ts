import { getOpenAIClient } from './openai-client.js';
import { AISuggestionResponseSchema, type AISuggestedMeeting } from './suggestion-schema.js';
import { AI_CONFIG } from '../config/ai-config.js';
import { buildSuggestionContext } from '../signal-context.js';
import { createDraftMeeting } from '../draft-meeting.js';
import type { Meeting } from '../../types.js';
import { IMMEDIATE_TIME_TYPE, FUTURE_TIME_TYPE, FRIEND_SPECIFIC_TARGET_TYPE, SYSTEM_PATTERN_SOURCE_TYPE } from '../../types.js';

// System prompt - the "personality" of your suggestion engine
const SYSTEM_PROMPT = `You are a meeting suggestion assistant for a social calling app.

Your job is to propose meeting times between friends based on:
- User signals (walking patterns, call intents, time preferences)
- Friend availability (who is broadcasting, recent interactions)
- Time context (current time, timezone)

Rules:
1. ONLY suggest meetings with friends the user has expressed intent to call
2. Prefer times that match user's patterns (e.g., walking time)
3. Keep reasons SHORT and friendly (max 1 sentence)
4. Never mention "AI" or "algorithm" in reasons
5. Confidence should reflect how well signals support the suggestion
6. If no good suggestions, return empty array - don't force bad ones

Good reason examples:
- "You usually walk around this time, and Alex is free"
- "You wanted to catch up with Sam this week"
- "Good time for a quick call before your work hours"

Bad reason examples (don't do these):
- "Based on my analysis of your patterns..."
- "The algorithm suggests..."
- "Statistically optimal time..."`;

export async function generateSuggestions(userId: string): Promise<AISuggestedMeeting[]> {
  if (!AI_CONFIG.enabled) {
    console.log('AI suggestions disabled');
    return [];
  }

  // 1. Build context (already implemented!)
  const context = await buildSuggestionContext(userId);

  // 2. Format context for the prompt
  const userPrompt = formatContextForPrompt(context);

  // 3. Call OpenAI
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: AI_CONFIG.model,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Empty response from OpenAI');
      return [];
    }

    // 4. Parse and validate
    const parsed = JSON.parse(content);
    const validated = AISuggestionResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('AI response validation failed:', validated.error);
      return [];
    }

    // 5. Additional business validation
    const validSuggestions = validated.data.suggestions.filter(s =>
      validateSuggestion(s, context)
    );

    return validSuggestions;

  } catch (error) {
    console.error('OpenAI API error:', error);
    return [];
  }
}

function formatContextForPrompt(context: Awaited<ReturnType<typeof buildSuggestionContext>>): string {
  const now = new Date().toISOString();

  return `
Current time: ${now}
User timezone: ${context.user.timezone || 'Unknown'}

## User Signals

Call intents (who they want to call):
${JSON.stringify(context.signals.callIntents, null, 2)}

Walking patterns:
${JSON.stringify(context.signals.walkPatterns, null, 2)}

Time preferences:
${JSON.stringify(context.signals.timeOfDayPreferences, null, 2)}

Work hours (unavailable times):
${JSON.stringify(context.signals.workHours, null, 2)}

## Friends
${context.friends.map(f => `- ${f.name} (${f.id})${f.isBroadcastingToMe ? ' [BROADCASTING NOW]' : ''}`).join('\n')}

## Recent Meetings (past 30 days)
${context.recentMeetings.meetings.map(m => `- ${m.title} with role ${m.role} at ${m.scheduledFor}`).join('\n') || 'None'}

Based on this context, suggest 0-3 possible meeting times. Return JSON matching this schema:
{
  "suggestions": [
    {
      "confidence": 0.8,
      "reason": "Short user-facing reason",
      "time": { "kind": "NOW" | "FUTURE", "startsAt": "ISO", "endsAt": "ISO" },
      "target": { "kind": "FRIEND", "friendId": "uuid" },
      "metadata": { "signalTypesUsed": ["CALL_INTENT"], "tags": ["walk"] }
    }
  ],
  "reasoning": "Internal notes (optional)"
}
`.trim();
}

function validateSuggestion(
  suggestion: AISuggestedMeeting,
  context: Awaited<ReturnType<typeof buildSuggestionContext>>
): boolean {
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
  const now = new Date();

  const scheduledFor = suggestion.time.kind === 'NOW'
    ? now
    : new Date(suggestion.time.startsAt!);

  const scheduledEnd = suggestion.time.kind === 'NOW'
    ? new Date(now.getTime() + 30 * 60 * 1000)  // 30 min default
    : new Date(suggestion.time.endsAt!);

  return createDraftMeeting({
    userFromId: userId,
    scheduledFor,
    scheduledEnd,
    title: suggestion.reason,
    timeType: suggestion.time.kind === 'NOW' ? IMMEDIATE_TIME_TYPE : FUTURE_TIME_TYPE,
    targetType: FRIEND_SPECIFIC_TARGET_TYPE,
    sourceType: SYSTEM_PATTERN_SOURCE_TYPE,  // AI-generated
    targetUserIds: [suggestion.target.friendId],
    suggestionReason: suggestion.reason,
    minParticipants: 1,
    maxParticipants: 1,
  });
}
