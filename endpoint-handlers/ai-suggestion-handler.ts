import type { Request, Response } from 'express';
import { generateSuggestions, createMeetingFromSuggestion } from '../backend/ai/suggestion-service.js';
import { AI_CONFIG } from '../backend/config/ai-config.js';

export const handleGenerateSuggestions = async (req: Request, res: Response) => {
  const { userId } = req.body;
  console.log("env is", process.env);
  console.log("AI COFIG IS -", AI_CONFIG)

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // if (!AI_CONFIG.enabled) {
  //   return res.json({ suggestions: [], message: 'AI suggestions disabled----' });
  // }

  try {
    // Generate suggestions from AI
    const suggestions = await generateSuggestions(userId);

    if (suggestions.length === 0) {
      return res.json({
        suggestions: [],
        message: 'No suggestions available right now'
      });
    }

    // Create DRAFT meetings for each suggestion
    const meetings = await Promise.all(
      suggestions.map(s => createMeetingFromSuggestion(userId, s))
    );

    res.json({
      suggestions: meetings,
      count: meetings.length,
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: 'Failed to generate suggestions!!!!!',
      details: errorMessage
    });
  }
};
