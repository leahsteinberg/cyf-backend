import { buildSuggestionContext } from '../signal-context.js';


export function formatContextForPrompt(context: Awaited<ReturnType<typeof buildSuggestionContext>>): string {
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
${context.friends.map(f => {
    const flags = [];
    if (f.hasOutgoingCallIntent && f.hasIncomingCallIntent) flags.push('[MUTUAL INTEREST]');
    else if (f.hasOutgoingCallIntent) flags.push('[I WANT TO CALL]');
    else if (f.hasIncomingCallIntent) flags.push('[WANTS TO CALL ME]');
    if (f.isBroadcastingToMe) flags.push('[BROADCASTING NOW]');
    return `- ${f.name} (${f.id})${flags.length > 0 ? ' ' + flags.join(' ') : ''}`;
  }).join('\n')}

## Recent Meetings (past 30 days)
${context.recentMeetings.meetings.map(m => `- ${m.title} with role ${m.role} at ${m.scheduledFor}`).join('\n') || 'None'}
`.trim();
}
