import { z } from 'zod';

// What the AI returns
export const AISuggestedMeetingSchema = z.object({
  confidence: z.number().min(0).max(1),
  reason: z.string().max(200),  // User-facing, keep short

  time: z.object({
    kind: z.enum(['NOW', 'FUTURE']),
    startsAt: z.string().datetime().optional(),  // ISO format
    endsAt: z.string().datetime().optional(),
  }),

  target: z.object({
    kind: z.literal('FRIEND'),  // v0: single friend only
    friendId: z.string(),
  }),

  metadata: z.object({
    signalTypesUsed: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),  // "walk", "catch-up"
  }).optional(),
});

export const AISuggestionResponseSchema = z.object({
  suggestions: z.array(AISuggestedMeetingSchema).max(3),
  reasoning: z.string().optional(),  // Internal, not shown to user
});

export type AISuggestedMeeting = z.infer<typeof AISuggestedMeetingSchema>;
export type AISuggestionResponse = z.infer<typeof AISuggestionResponseSchema>;

// Schema for suggest-new-time AI response
export const SuggestNewTimeResponseSchema = z.object({
  suggestedTime: z.object({
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  }),
  reason: z.string().max(200).optional(),
});

export type SuggestNewTimeResponse = z.infer<typeof SuggestNewTimeResponseSchema>;
