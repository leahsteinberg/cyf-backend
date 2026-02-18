import { z } from 'zod';
import { getOpenAIClient } from './openai-client.js';
import { AI_CONFIG } from '../config/ai-config.js';

export async function callAI<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>
): Promise<T | null> {
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: AI_CONFIG.model,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Empty response from OpenAI');
      return null;
    }

    const parsed = JSON.parse(content);
    const validated = schema.safeParse(parsed);

    if (!validated.success) {
      console.error('AI response validation failed:', validated.error);
      return null;
    }

    return validated.data;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}
