# Implementation Guide: ADVANCE_PARALLEL Meeting Type

## Overview
This guide outlines how to implement parallel offer distribution for ADVANCE meetings by creating a new `ADVANCE_PARALLEL` meeting type. This allows all friends to receive offers simultaneously instead of sequentially.

**Current ADVANCE behavior:** Sequential offers to one friend at a time
**New ADVANCE_PARALLEL behavior:** Parallel offers to all friends simultaneously

---

## Phase 1: Update Prisma Schema

### Step 1.1: Add New Meeting Type to Enum

**File:** `prisma/schema.prisma`

**Change:** Update the `MeetingType` enum (around line 167):

```prisma
enum MeetingType {
  ADVANCE
  ADVANCE_PARALLEL  // Add this new type
  BROADCAST
}
```

### Step 1.2: Regenerate Prisma Client

```bash
npx prisma generate
```

**Expected output:**
```
✔ Generated Prisma Client (v6.x.x) to ./generated/prisma
```

### Step 1.3: Update TypeScript Types (if needed)

Check if `types.ts` needs updating. The Prisma generation should handle this automatically, but verify that `MeetingType` includes `ADVANCE_PARALLEL`.

---

## Phase 2: Create New Functions for Parallel Offers

### Step 2.1: Create Parallel Offer Creation Function

**File:** `backend/process-meeting.ts`

**Add this new function** (after `makeAdvanceOffer` around line 141):

```typescript
/**
 * Creates offers for ALL friends simultaneously for ADVANCE_PARALLEL meetings
 * All offers expire at the meeting's scheduledFor time
 */
export const createParallelOffersForMeeting = async (meeting: Meeting): Promise<Offer[]> => {
    // Validate meeting exists and has required fields
    if (!meeting || !meeting.id || !meeting.userFromId) {
        throw new Error("Invalid meeting: missing required fields");
    }

    const allFriendIds = await getFriendIds(meeting.userFromId);

    if (allFriendIds.length === 0) {
        console.log("No friends to send offers to");
        return [];
    }

    // All offers expire at the meeting time (no complex expiration calculation)
    const expiresAt = meeting.scheduledFor;

    console.log(`Creating ${allFriendIds.length} parallel offers for meeting ${meeting.id}`);

    // Create all offers in parallel
    const offerPromises = allFriendIds.map(friendId =>
        makeOffer({
            meeting,
            userOfferedId: friendId,
            expiresAt,
            offerType: 'ADVANCE_PARALLEL'
        })
    );

    const offers = await Promise.all(offerPromises);

    // Filter out any undefined offers (in case some failed)
    const validOffers = offers.filter(Boolean) as Offer[];

    console.log(`Successfully created ${validOffers.length} offers`);

    return validOffers;
};
```

### Step 2.2: Create Parallel Offer Processing Function

**File:** `backend/process-meeting.ts`

**Add this new function** (after `processOffersForBroadcastMeeting` around line 174):

```typescript
/**
 * Processes ADVANCE_PARALLEL meetings
 * Much simpler than ADVANCE - just checks if meeting is past
 * No offer rotation or expiration logic needed since all offers already sent
 */
const processOffersForParallelMeeting = async (meeting: Meeting) => {
    const meetingId = meeting.id;

    // Check if meeting time has passed
    const meetingInPast = await isTimePast({eventTime: meeting.scheduledFor});

    if (meetingInPast) {
        // Meeting is past - expire all open offers and mark meeting as PAST
        const offers = await getMeetingOffers({meetingId});
        await clearOutOffers(offers);
        return await setMeetingState({meetingId, meetingState: PAST_MEETING_STATE});
    }

    // Meeting is still active - nothing to do (offers already sent)
    return meeting;
};
```

### Step 2.3: Update Main Processing Function

**File:** `backend/process-meeting.ts`

**Modify:** `processOffersForMeeting` function (around line 177)

**Change the routing logic to handle three types:**

```typescript
export const processOffersForMeeting = async (meeting: Meeting) => {
    const meetingId = meeting.id;
    const userFrom = meeting.userFromId;

    // Route to appropriate handler based on meeting type
    if (meeting.meetingType === 'BROADCAST') {
        return processOffersForBroadcastMeeting(meeting);
    }

    if (meeting.meetingType === 'ADVANCE_PARALLEL') {
        return processOffersForParallelMeeting(meeting);
    }

    // Original ADVANCE logic continues below for backwards compatibility...
    const offers = await getMeetingOffers({meetingId})
    const {recentOffer, olderOffers} = findRecentOffer(offers);

    // ... rest of existing ADVANCE logic unchanged ...
```

---

## Phase 3: Update Offer Acceptance Logic

### Step 3.1: Modify acceptOffer to Clear Other Offers

**File:** `backend/offer.ts`

**Replace:** The `acceptOffer` function (around line 15-30)

**With:**

```typescript
export const acceptOffer = async ({ userId, offerId }
    : { userId: string, offerId: string }): Promise<Offer> => {
    const offer = await getOfferById({offerId});
    if (!offer) {
        throw new Error('Offer not found');
    }

    const meetingId = offer?.meetingId;

    // Accept this specific offer
    const acceptedOffer = await setOfferAccepted({ offerId });

    if (meetingId) {
        // Set the meeting as accepted
        const acceptedMeeting = await setMeetingAccepted({ meetingId, userId });

        // For ADVANCE_PARALLEL meetings: expire all other open offers
        // This ensures only one person can accept
        if (offer.offerType === 'ADVANCE_PARALLEL') {
            const allOffers = await getMeetingOffers({ meetingId });
            const otherOpenOffers = allOffers.filter(o =>
                o.id !== offerId && o.offerState === OPEN_OFFER_STATE
            );

            console.log(`Expiring ${otherOpenOffers.length} other offers for ADVANCE_PARALLEL meeting`);

            // Expire all other offers in parallel
            await Promise.all(
                otherOpenOffers.map(o => setOfferExpired({ offerId: o.id }))
            );
        }
    }

    return acceptedOffer;
};
```

**Note:** You'll need to import `OPEN_OFFER_STATE` if not already imported.

---

## Phase 4: Update Meeting Creation

### Step 4.1: Modify Meeting Creation Handler

**File:** `endpoint-handlers/meeting-handler.ts`

**Current behavior:** Creates meeting, then calls `processOfferForNewMeeting` which creates ONE offer

**Change needed:** Route to different logic based on meeting type

**Find:** `handleCreateMeeting` function

**After the meeting is created** (around where `processOfferForNewMeeting` is called):

```typescript
const meeting = await createMeeting({
    userFromId,
    scheduledEnd,
    scheduledFor,
    title,
    meetingType: 'ADVANCE'  // or get from request body
});

// Route based on meeting type
if (meeting.meetingType === 'ADVANCE_PARALLEL') {
    // Create all offers at once
    await createParallelOffersForMeeting(meeting);
} else if (meeting.meetingType === 'ADVANCE') {
    // Original sequential logic
    await processOfferForNewMeeting(meeting);
}

res.json({ meeting, message: "New meeting created!" });
```

### Step 4.2: (Optional) Allow Client to Specify Type

**Modify request body to accept meetingType:**

```typescript
export const handleCreateMeeting = async (req: Request, res: Response) => {
  const {
      userFromId,
      scheduledEnd,
      scheduledFor,
      title,
      meetingType  // Add this - defaults to 'ADVANCE' if not provided
  } = req.body;

  try {
    // ... validation ...

    const meeting = await createMeeting({
        userFromId,
        scheduledEnd,
        scheduledFor,
        title,
        meetingType: meetingType || 'ADVANCE'  // Default to ADVANCE
    });

    // Route based on meeting type
    if (meeting.meetingType === 'ADVANCE_PARALLEL') {
        await createParallelOffersForMeeting(meeting);
    } else if (meeting.meetingType === 'ADVANCE') {
        await processOfferForNewMeeting(meeting);
    }

    res.json({ meeting, message: "New meeting created!" });
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## Phase 5: Update Imports

Make sure all necessary imports are added to modified files:

### `backend/process-meeting.ts`
```typescript
// Should already have these, but verify:
import { getMeetingOffers, setOfferExpired, createOffer } from './offer.js';
import { setMeetingState } from './update/meeting-update.js';
import { OPEN_OFFER_STATE, PAST_MEETING_STATE } from './utils.js';
import { getFriendIds } from './friendship.js';
import type { Meeting, Offer } from '../types.js';
```

### `backend/offer.ts`
```typescript
// Add if not already present:
import { OPEN_OFFER_STATE } from './utils.js';
import { getMeetingOffers } from './offer.js';  // or from appropriate location
import { setOfferExpired } from './update/offer-update.js';
```

---

## Phase 6: Testing Strategy

### Test Case 1: Create ADVANCE_PARALLEL Meeting
```bash
POST /api/create-meeting
{
  "userFromId": "user-123",
  "scheduledFor": "2025-12-15T14:00:00Z",
  "scheduledEnd": "2025-12-15T15:00:00Z",
  "title": "Test Parallel Meeting",
  "meetingType": "ADVANCE_PARALLEL"
}
```

**Expected:**
- Meeting created with `meetingType: 'ADVANCE_PARALLEL'`
- All friends receive offers immediately
- All offers have `expiresAt` = meeting's `scheduledFor` time
- All offers have `offerType: 'ADVANCE_PARALLEL'`

### Test Case 2: Accept an Offer
```bash
POST /api/accept-offer
{
  "userId": "friend-456",
  "offerId": "offer-789"
}
```

**Expected:**
- Offer state changes to ACCEPTED
- Meeting state changes to ACCEPTED
- Meeting's `acceptedUserId` is set to "friend-456"
- **All other OPEN offers for this meeting expire**

### Test Case 3: Verify Old ADVANCE Still Works
```bash
POST /api/create-meeting
{
  "userFromId": "user-123",
  "scheduledFor": "2025-12-15T14:00:00Z",
  "scheduledEnd": "2025-12-15T15:00:00Z",
  "title": "Test Sequential Meeting",
  "meetingType": "ADVANCE"  // or omit for default
}
```

**Expected:**
- Meeting created with `meetingType: 'ADVANCE'`
- Only ONE friend receives offer initially
- Offer has calculated expiration time (complex logic)
- Sequential offer rotation continues to work

### Test Case 4: Past Meeting Cleanup
- Create ADVANCE_PARALLEL meeting
- Wait for `scheduledFor` time to pass (or manually set to past)
- Run cron job

**Expected:**
- Meeting state changes to PAST
- All remaining OPEN offers expire

---

## Phase 7: Database Migration (None Required!)

**Good news:** No database migration needed!

The `MeetingType` enum is already stored as a string in PostgreSQL, so adding `ADVANCE_PARALLEL` to the enum doesn't require a migration. Existing meetings will continue to have `ADVANCE` or `BROADCAST` as their type.

---

## Phase 8: Rollback Plan

If you need to rollback:

### Quick Rollback (Code Only)
1. Revert code changes in Git
2. Redeploy previous version
3. Existing ADVANCE_PARALLEL meetings will fail gracefully (treated as unknown type)

### Full Rollback (Including Enum)
1. Remove `ADVANCE_PARALLEL` from schema enum
2. Run `npx prisma generate`
3. Redeploy

**Note:** Any meetings created with ADVANCE_PARALLEL type will error. You may want to manually update them in the database first:

```sql
UPDATE meeting
SET "meetingType" = 'ADVANCE'
WHERE "meetingType" = 'ADVANCE_PARALLEL';
```

---

## Optional Phase 9: Migration Endpoint

Create an endpoint to convert existing ADVANCE meetings to ADVANCE_PARALLEL:

**File:** `endpoint-handlers/meeting-handler.ts`

```typescript
export const handleConvertToParallel = async (req: Request, res: Response) => {
    const { meetingId, userId } = req.body;

    if (!meetingId || !userId) {
        return res.status(400).json({ error: "meetingId and userId are required" });
    }

    try {
        const meeting = await getMeetingById({ meetingId });

        if (!meeting) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        // Verify user owns this meeting
        if (meeting.userFromId !== userId) {
            return res.status(403).json({ error: "You can only convert your own meetings" });
        }

        // Only convert ADVANCE meetings
        if (meeting.meetingType !== 'ADVANCE') {
            return res.status(400).json({
                error: `Meeting is already ${meeting.meetingType}`
            });
        }

        // Only convert meetings that are still SEARCHING
        if (meeting.meetingState !== 'SEARCHING') {
            return res.status(400).json({
                error: `Cannot convert meetings in ${meeting.meetingState} state`
            });
        }

        // Update meeting type
        const updatedMeeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: { meetingType: 'ADVANCE_PARALLEL' }
        });

        // Expire existing offers
        const existingOffers = await getMeetingOffers({ meetingId });
        await clearOutOffers(existingOffers);

        // Create new parallel offers
        await createParallelOffersForMeeting(updatedMeeting);

        res.json({
            success: true,
            meeting: updatedMeeting,
            message: "Meeting converted to ADVANCE_PARALLEL"
        });
    } catch (error) {
        console.error("Error converting meeting:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            error: "Internal server error",
            details: errorMessage
        });
    }
};
```

**Register route in `app.ts`:**
```typescript
app.post('/api/convert-to-parallel', handleConvertToParallel);
```

---

## Checklist

Before deploying to production:

- [ ] Schema updated with ADVANCE_PARALLEL enum value
- [ ] Prisma client regenerated
- [ ] `createParallelOffersForMeeting` function added
- [ ] `processOffersForParallelMeeting` function added
- [ ] `processOffersForMeeting` routes to new handler
- [ ] `acceptOffer` expires other offers for parallel meetings
- [ ] `handleCreateMeeting` routes based on type
- [ ] All imports verified
- [ ] Test: Create ADVANCE_PARALLEL meeting → all friends get offers
- [ ] Test: Accept offer → other offers expire
- [ ] Test: Past meeting → all offers expire
- [ ] Test: Old ADVANCE still works
- [ ] Rollback plan documented and tested
- [ ] Team notified of new feature

---

## File Summary

Files that need changes:

1. **prisma/schema.prisma** - Add ADVANCE_PARALLEL to enum
2. **backend/process-meeting.ts** - Add parallel offer functions and routing
3. **backend/offer.ts** - Update acceptOffer to clear other offers
4. **endpoint-handlers/meeting-handler.ts** - Route based on meeting type
5. **(Optional) app.ts** - Register conversion endpoint

Files that DON'T need changes:
- Database schema (no migration needed)
- Offer creation/update functions
- Cron handler (works with new routing)
- User-facing endpoints (besides create meeting)

---

## Support

If you run into issues:

1. Check TypeScript errors first
2. Verify Prisma generation completed successfully
3. Check console logs for offer creation
4. Verify all imports are correct
5. Test with a single friend first before testing with many

---

## Future Enhancements

Consider these improvements later:

1. **Batch Notifications**: Send push notifications in batches instead of one-by-one
2. **Rate Limiting**: Limit number of parallel offers to prevent spam
3. **Analytics**: Track acceptance rates for parallel vs sequential
4. **UI Toggle**: Allow users to choose ADVANCE vs ADVANCE_PARALLEL in the app
5. **Deprecation**: Eventually deprecate ADVANCE and migrate all to ADVANCE_PARALLEL

---

*Document created: 2025-12-11*
*Last updated: 2025-12-11*
