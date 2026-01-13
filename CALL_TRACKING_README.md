# Call Tracking System

A flexible event tracking system for logging user calls and other activities.

## Overview

The system uses a generic `UserEvent` model that can track any user action with flexible JSON metadata. This makes it easy to add new event types without schema changes.

## Database Schema

```typescript
model UserEvent {
  id         String   @id @default(uuid())
  userId     String
  eventType  String   // e.g., "call_started", "call_ended", "meeting_viewed"
  metadata   Json?    // Flexible data storage
  createdAt  DateTime @default(now())

  // Indexes for fast queries
  @@index([userId, eventType])
  @@index([eventType, createdAt])
}
```

## API Endpoints

### 1. Start Call
**POST** `/api/calls/start`

Log when a user starts a call.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "meetingId": "meeting-uuid",
  "participantId": "other-user-uuid",  // Optional
  "callType": "video"  // Optional: "video" | "audio", defaults to "video"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event-uuid",
  "timestamp": "2025-01-12T..."
}
```

### 2. End Call
**POST** `/api/calls/end`

Log when a user ends a call.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "meetingId": "meeting-uuid",
  "participantId": "other-user-uuid",  // Optional
  "duration": 180,  // Optional: duration in seconds
  "endReason": "completed"  // Optional: "completed" | "error" | "user_hangup" | "timeout"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event-uuid",
  "timestamp": "2025-01-12T..."
}
```

### 3. Log Call Error
**POST** `/api/calls/error`

Log when a call encounters an error.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "meetingId": "meeting-uuid",
  "participantId": "other-user-uuid",  // Optional
  "errorType": "connection_failed",
  "errorMessage": "Network timeout"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event-uuid",
  "timestamp": "2025-01-12T..."
}
```

## Frontend Usage Examples

### React Native / Expo

```typescript
// When user starts a call
const startCall = async (meetingId: string, participantId: string) => {
  try {
    await fetch('https://your-api.com/api/calls/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        meetingId,
        participantId,
        callType: 'video'
      })
    });
  } catch (error) {
    console.error('Failed to log call start:', error);
  }
};

// When user ends a call
const endCall = async (meetingId: string, startTime: Date) => {
  const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);

  try {
    await fetch('https://your-api.com/api/calls/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        meetingId,
        duration,
        endReason: 'completed'
      })
    });
  } catch (error) {
    console.error('Failed to log call end:', error);
  }
};

// When call encounters error
const logCallError = async (meetingId: string, error: Error) => {
  try {
    await fetch('https://your-api.com/api/calls/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        meetingId,
        errorType: error.name,
        errorMessage: error.message
      })
    });
  } catch (e) {
    console.error('Failed to log call error:', e);
  }
};
```

## Backend Query Examples

### Get user's call count
```typescript
import { getUserEventCount } from './backend/update/event-tracking.js';

const callCount = await getUserEventCount({
  userId: 'user-uuid',
  eventType: 'call_started'
});

console.log(`User has made ${callCount} calls`);
```

### Get user's recent calls
```typescript
import { getUserEvents } from './backend/update/event-tracking.js';

const recentCalls = await getUserEvents({
  userId: 'user-uuid',
  eventType: 'call_started',
  limit: 10
});

console.log('Recent calls:', recentCalls);
```

### Get calls this week
```typescript
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

const callsThisWeek = await getUserEventCount({
  userId: 'user-uuid',
  eventType: 'call_started',
  since: oneWeekAgo
});
```

### Calculate average call duration
```typescript
const callEndEvents = await getUserEvents({
  userId: 'user-uuid',
  eventType: 'call_ended',
  limit: 100
});

const durations = callEndEvents
  .map(e => e.metadata.duration)
  .filter(d => d != null);

const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
console.log(`Average call duration: ${avgDuration} seconds`);
```

## Future Extensibility

### Adding New Event Types

The system is designed to be easily extensible. To add a new event type:

1. Define the metadata type in `backend/update/[feature]-tracking.ts`:

```typescript
export type MeetingViewedMetadata = {
  meetingId: string;
  viewDuration?: number;
  timestamp: string;
};

export const logMeetingViewed = async (
  userId: string,
  metadata: MeetingViewedMetadata
) => {
  return logEvent({
    userId,
    eventType: 'meeting_viewed',
    metadata,
  });
};
```

2. Add endpoint if needed (or call directly from backend)
3. Query the events using the generic `getUserEvents` function

### Example: Tracking Meeting Views

```typescript
// Log when user views a meeting
await logEvent({
  userId: 'user-uuid',
  eventType: 'meeting_viewed',
  metadata: {
    meetingId: 'meeting-uuid',
    viewDuration: 30,
    timestamp: new Date().toISOString()
  }
});

// Query meeting views
const views = await getUserEvents({
  userId: 'user-uuid',
  eventType: 'meeting_viewed'
});
```

## Benefits

✅ **Quick to implement**: One table, simple inserts
✅ **Flexible**: JSON metadata can store anything
✅ **Extensible**: Easy to add new event types
✅ **Type-safe**: TypeScript types for metadata
✅ **Analytics-ready**: Indexed for fast queries
✅ **Non-blocking**: Event logging doesn't break main flow

## Future Features

- Call history UI
- User engagement dashboard
- "You've talked X times this month" stats
- Call quality analytics
- Automated insights ("Your longest call was 45 minutes!")
- Social proof features
- Pattern-based recommendations
