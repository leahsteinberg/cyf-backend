Backend for the [call-your-friends](https://github.com/leahsteinberg/call-your-friends) React Native app — a tool for scheduling spontaneous phone calls with friends.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| ORM | Prisma |
| Media storage | CDN (photo upload/retrieval) |
| Push notifications | Expo Push Notification service |
| AI suggestions |

---

## Features

### Meetings & Offers
Users create meetings targeting one or more friends. The backend matches availability and surfaces **offers** — proposed meeting times sent to target users to accept or reject.

### Broadcast
A **broadcast** is an open-ended "available now" signal. When a user goes live, the backend fans the broadcast out as offers to eligible friends. The first friend to claim it converts it into a confirmed meeting. The backend tracks broadcast sub-states (`UNCLAIMED → PENDING_CLAIMED → CLAIMED`) and expires stale broadcasts automatically.

### Push Notifications
The server sends push notifications via Expo's notification service for incoming offers, accepted meetings, broadcast claims, and other real-time events.

### Event System
Internal actions (meeting created, offer accepted, broadcast claimed, etc.) are dispatched through an event emitter for eventual monitoring.

### AI Suggestions
Based on user activity history and preferences, we pass that to an AI agent that generates meeting suggestions at times likely to work for both users. Suggestions are presented as cards the user can accept, dismiss, or reschedule.

### Photo CDN
Meeting and user avatar photos are uploaded to a CDN. URLs are returned on the relevant API responses.
