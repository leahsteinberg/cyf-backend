import { z } from 'zod';
export declare const AISuggestedMeetingSchema: z.ZodObject<{
    confidence: z.ZodNumber;
    reason: z.ZodString;
    time: z.ZodObject<{
        kind: z.ZodEnum<{
            FUTURE: "FUTURE";
            NOW: "NOW";
        }>;
        startsAt: z.ZodOptional<z.ZodString>;
        endsAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    target: z.ZodObject<{
        kind: z.ZodLiteral<"FRIEND">;
        friendId: z.ZodString;
    }, z.core.$strip>;
    metadata: z.ZodOptional<z.ZodObject<{
        signalTypesUsed: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const AISuggestionResponseSchema: z.ZodObject<{
    suggestions: z.ZodArray<z.ZodObject<{
        confidence: z.ZodNumber;
        reason: z.ZodString;
        time: z.ZodObject<{
            kind: z.ZodEnum<{
                FUTURE: "FUTURE";
                NOW: "NOW";
            }>;
            startsAt: z.ZodOptional<z.ZodString>;
            endsAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        target: z.ZodObject<{
            kind: z.ZodLiteral<"FRIEND">;
            friendId: z.ZodString;
        }, z.core.$strip>;
        metadata: z.ZodOptional<z.ZodObject<{
            signalTypesUsed: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    reasoning: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AISuggestedMeeting = z.infer<typeof AISuggestedMeetingSchema>;
export type AISuggestionResponse = z.infer<typeof AISuggestionResponseSchema>;
//# sourceMappingURL=suggestion-schema.d.ts.map