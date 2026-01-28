export const AI_CONFIG = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.3, // Low for consistency
    maxTokens: 500, // Suggestions are short
    enabled: process.env.SUGGESTION_ENABLED === 'true',
};
//# sourceMappingURL=ai-config.js.map