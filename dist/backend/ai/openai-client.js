import OpenAI from 'openai';
let openaiClient = null;
export function getOpenAIClient() {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }
        openaiClient = new OpenAI({ apiKey });
    }
    return openaiClient;
}
//# sourceMappingURL=openai-client.js.map