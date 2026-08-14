import { buildSuggestionContext } from '../signal-context.js';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BAND_LABELS = ['6–9am', '9am–12pm', '12–3pm', '3–6pm', '6–9pm', '9pm–12am'];

// Converts sparse { day, band } slots into readable lines, e.g. "Monday: 6–9am, 9am–12pm"
function formatTimePreferenceSlots(payload: { slots?: { day: number; band: number }[] }): string {
    const slots = payload?.slots;
    if (!slots || slots.length === 0) return '(none selected)';

    const byDay = new Map<number, number[]>();
    for (const { day, band } of slots) {
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push(band);
    }

    return Array.from(byDay.entries())
        .sort(([a], [b]) => a - b)
        .map(([day, bands]) => {
            const bandStr = bands.sort((a, b) => a - b).map(b => BAND_LABELS[b] ?? `band${b}`).join(', ');
            return `${DAY_NAMES[day] ?? `day${day}`}: ${bandStr}`;
        })
        .join('\n');
}

// Formats a Date as an ISO string with the correct UTC offset for a given IANA timezone,
// e.g. "2025-07-29T06:30:00-07:00". Falls back to toISOString() if timezone is unknown.
function toLocalISOString(date: Date, timezone: string | null): string {
    if (!timezone) return date.toISOString();
    try {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
        }).formatToParts(date);
        const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

        const offsetPart = new Intl.DateTimeFormat('en', {
            timeZone: timezone,
            timeZoneName: 'longOffset',
        }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
        const offset = offsetPart.replace('GMT', '') || '+00:00';

        return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}${offset}`;
    } catch {
        return date.toISOString();
    }
}

export function formatContextForPrompt(context: Awaited<ReturnType<typeof buildSuggestionContext>>): string {
  const timezone = context.user.timezone ?? null;
  const now = toLocalISOString(new Date(), timezone);

  const signalSections: string[] = [];
  if (context.signals.callIntents.length > 0) {
    signalSections.push(`Call intents (who they want to call):\n${JSON.stringify(context.signals.callIntents, null, 2)}`);
  }
  if (context.signals.walkPatterns.length > 0) {
    signalSections.push(`Walking patterns:\n${JSON.stringify(context.signals.walkPatterns, null, 2)}`);
  }
  if (context.signals.timeOfDayPreferences.length > 0) {
    const prefLines = context.signals.timeOfDayPreferences
      .map(s => formatTimePreferenceSlots(s.payload as { slots?: { day: number; band: number }[] }))
      .join('\n');
    signalSections.push(`Preferred call times (user's local time):\n${prefLines}`);
  }
  if (context.signals.workHours.length > 0) {
    signalSections.push(`Work hours (unavailable times):\n${JSON.stringify(context.signals.workHours, null, 2)}`);
  }

  const recentMeetingLines = context.recentMeetings.meetings
    .map(m => `- ${m.title} with role ${m.role} at ${toLocalISOString(new Date(m.scheduledFor), timezone)}`)
    .join('\n');

  const sections: string[] = [
    `Current time: ${now}`,
    `User timezone: ${timezone || 'Unknown'}`,
  ];

  if (signalSections.length > 0) {
    sections.push(`## User Signals\n\n${signalSections.join('\n\n')}`);
  }

  if (context.friends.length > 0) {
    const friendLines = context.friends.map(f => {
      const flags = [];
      if (f.hasOutgoingCallIntent && f.hasIncomingCallIntent) flags.push('[MUTUAL INTEREST]');
      else if (f.hasOutgoingCallIntent) flags.push('[I WANT TO CALL]');
      else if (f.hasIncomingCallIntent) flags.push('[WANTS TO CALL ME]');
      if (f.isBroadcastingToMe) flags.push('[BROADCASTING NOW]');
      return `- ${f.name} (${f.id})${flags.length > 0 ? ' ' + flags.join(' ') : ''}`;
    }).join('\n');
    sections.push(`## Friends\n${friendLines}`);
  }

  if (recentMeetingLines) {
    sections.push(`## Recent Meetings (past 30 days)\n${recentMeetingLines}`);
  }

  return sections.join('\n\n');
}
