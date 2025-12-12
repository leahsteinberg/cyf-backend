# Migration Plan: Draft Meetings & Flexible Meeting Types

## Overview
This document outlines a safe, incremental migration from the current `MeetingType`-based system to a more flexible system using `TimeType`, `TargetType`, and `DRAFT` state.

**Goal:** Support draft/suggestion meetings and eliminate rigid MeetingType enum without breaking existing functionality.

---

## Current vs. New Architecture

### Current System
```prisma
enum MeetingType {
  ADVANCE         // Sequential offers, scheduled
  BROADCAST       // Parallel offers, immediate
  ADVANCE_PARALLEL // (if implemented) Parallel offers, scheduled
}

enum MeetingState {
  SEARCHING
  ACCEPTED
  REJECTED
  PAST
}
```

**Limitations:**
- Can't represent draft/suggestion meetings
- Rigid types don't support new patterns
- MeetingType conflates multiple concerns (timing + distribution + target)

### New System
```prisma
enum TimeType {
  IMMEDIATE   // Happening now (old BROADCAST)
  FUTURE      // Scheduled for later (old ADVANCE)
  UNKNOWN     // Time TBD (new concept)
}

enum TargetType {
  OPEN             // Multiple friends can accept (old BROADCAST)
  FRIEND_SPECIFIC  // Specific friend (new concept)
  GROUP            // Predefined group (future)
}

enum MeetingState {
  DRAFT      // NEW: Suggestion before activation
  SEARCHING
  ACCEPTED
  REJECTED
  PAST
  EXPIRED    // NEW: For time-bounded suggestions
}

enum SourceType {  // Optional for now
  USER_INTENT
  SYSTEM_PATTERN
  SYSTEM_REAL_TIME
}
```

**Benefits:**
- ✅ Can represent suggestions/drafts
- ✅ Flexible combinations of time and target
- ✅ Clear separation of concerns
- ✅ Future-proof for new patterns

---

## Mapping Old to New

| Old MeetingType | New TimeType | New TargetType | Notes |
|-----------------|--------------|----------------|-------|
| ADVANCE | FUTURE | OPEN (sequential) | Sequential offers to friends |
| BROADCAST | IMMEDIATE | OPEN | Parallel offers, immediate |
| ADVANCE_PARALLEL | FUTURE | OPEN | Parallel offers, scheduled |

**Key Insight:** MeetingType was really encoding `(TimeType, TargetType, OfferStrategy)`

---

## Migration Strategy: Dual-Write Pattern

**Principle:** Never break existing functionality. Support both old and new systems simultaneously, then gradually deprecate old.

### Phase 1: Add New Fields (Additive Only)
### Phase 2: Dual-Write (Write Both Old & New)
### Phase 3: Migrate Existing Data
### Phase 4: Dual-Read (Read New, Fallback to Old)
### Phase 5: Deprecate Old System
### Phase 6: Remove Old Fields

---

## Phase 1: Add New Fields (Week 1-2)

### Step 1.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

**Add new enums:**
```prisma
enum TimeType {
  IMMEDIATE
  FUTURE
  UNKNOWN
}

enum TargetType {
  OPEN
  FRIEND_SPECIFIC
  GROUP
}

enum SourceType {
  USER_INTENT
  SYSTEM_PATTERN
  SYSTEM_REAL_TIME
}
```

**Update MeetingState enum:**
```prisma
enum MeetingState {
  DRAFT      // NEW
  SEARCHING
  ACCEPTED
  REJECTED
  PAST
  EXPIRED    // NEW
}
```

**Update Meeting model (ADD fields, don't remove MeetingType yet):**
```prisma
model Meeting {
  id                String              @id @default(uuid())
  userFrom          User                @relation("meetingsCreated", fields: [userFromId], references: [id])
  userFromId        String
  acceptedUserId    String?
  acceptedUser      User?               @relation("meetingsAccepted", fields: [acceptedUserId], references: [id])
  createdAt         DateTime            @default(now())
  scheduledFor      DateTime
  scheduledEnd      DateTime
  offers            Offer[]             @relation("offers")
  title             String?
  meetingState      MeetingState        @default(SEARCHING)

  // OLD FIELD - Keep for backwards compatibility
  meetingType       MeetingType         @default(ADVANCE)

  // NEW FIELDS - Add these
  timeType          TimeType?           // Nullable during migration
  targetType        TargetType?         // Nullable during migration
  sourceType        SourceType?         // Optional
  intentLabel       String?             // Optional semantic label

  broadcastMetadata BroadcastMetadata?

  @@map("meeting")
}
```

**Keep MeetingType for now:**
```prisma
enum MeetingType {
  ADVANCE
  BROADCAST
  ADVANCE_PARALLEL
}
```

### Step 1.2: Create Migration

```bash
npx prisma migrate dev --name add_draft_meeting_fields
```

**This migration will:**
- Add `timeType`, `targetType`, `sourceType`, `intentLabel` columns (nullable)
- Add DRAFT and EXPIRED to MeetingState enum
- Add TimeType, TargetType, SourceType enums
- **NOT remove or change MeetingType** (safe!)

### Step 1.3: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 1.4: Update TypeScript Types

**File:** `types.ts`

Add type guards and utilities:
```typescript
// Migration helper: Map old MeetingType to new types
export function meetingTypeToNew(meetingType: MeetingType): {
  timeType: TimeType;
  targetType: TargetType;
} {
  switch (meetingType) {
    case 'ADVANCE':
    case 'ADVANCE_PARALLEL':
      return { timeType: 'FUTURE', targetType: 'OPEN' };
    case 'BROADCAST':
      return { timeType: 'IMMEDIATE', targetType: 'OPEN' };
    default:
      throw new Error(`Unknown meeting type: ${meetingType}`);
  }
}

// Migration helper: Map new types to old MeetingType (for backwards compat)
export function newToMeetingType(timeType: TimeType, targetType: TargetType): MeetingType {
  if (timeType === 'IMMEDIATE' && targetType === 'OPEN') {
    return 'BROADCAST';
  }
  if (timeType === 'FUTURE' && targetType === 'OPEN') {
    return 'ADVANCE';  // Default to ADVANCE for sequential
  }
  // Can't represent FRIEND_SPECIFIC or UNKNOWN in old system
  return 'ADVANCE';  // Safe fallback
}

// Type guard for new system meetings
export function hasNewFields(meeting: Meeting): meeting is Meeting & {
  timeType: TimeType;
  targetType: TargetType;
} {
  return meeting.timeType !== null && meeting.targetType !== null;
}
```

---

## Phase 2: Dual-Write (Week 2-3)

**Principle:** When creating new meetings, write BOTH old and new fields.

### Step 2.1: Update Meeting Creation Functions

**File:** `backend/update/meeting-update.ts`

```typescript
import { meetingTypeToNew } from '../../types.js';

export const createMeeting = async ({
  userFromId,
  scheduledEnd,
  scheduledFor,
  title,
  meetingType,
  // NEW PARAMETERS (optional during transition)
  timeType,
  targetType,
  sourceType,
  intentLabel
}: {
  userFromId: string;
  scheduledEnd: Date;
  scheduledFor: Date;
  title?: string;
  meetingType?: MeetingType;  // Make optional
  timeType?: TimeType;         // NEW
  targetType?: TargetType;     // NEW
  sourceType?: SourceType;     // NEW
  intentLabel?: string;        // NEW
}): Promise<Meeting> => {

  // DUAL-WRITE: If new fields provided, derive old. If old provided, derive new.
  let finalMeetingType: MeetingType;
  let finalTimeType: TimeType;
  let finalTargetType: TargetType;

  if (timeType && targetType) {
    // New system: derive old from new
    finalTimeType = timeType;
    finalTargetType = targetType;
    finalMeetingType = newToMeetingType(timeType, targetType);
  } else if (meetingType) {
    // Old system: derive new from old
    const derived = meetingTypeToNew(meetingType);
    finalMeetingType = meetingType;
    finalTimeType = derived.timeType;
    finalTargetType = derived.targetType;
  } else {
    throw new Error('Must provide either meetingType OR (timeType + targetType)');
  }

  const meeting = await prisma.meeting.create({
    data: {
      userFromId,
      scheduledEnd,
      scheduledFor,
      title,
      // Write BOTH old and new
      meetingType: finalMeetingType,
      timeType: finalTimeType,
      targetType: finalTargetType,
      sourceType,
      intentLabel,
      meetingState: 'SEARCHING',  // or DRAFT if it's a suggestion
    },
    include: {
      broadcastMetadata: true
    }
  });

  return meeting;
};
```

### Step 2.2: Update Endpoints to Support Both

**File:** `endpoint-handlers/meeting-handler.ts`

```typescript
export const handleCreateMeeting = async (req: Request, res: Response) => {
  const {
    userFromId,
    scheduledEnd,
    scheduledFor,
    title,
    // OLD WAY (backwards compatible)
    meetingType,
    // NEW WAY (preferred)
    timeType,
    targetType,
    sourceType,
    intentLabel
  } = req.body;

  try {
    // Accept either old or new format
    const meeting = await createMeeting({
      userFromId,
      scheduledEnd,
      scheduledFor,
      title,
      meetingType,    // May be undefined
      timeType,       // May be undefined
      targetType,     // May be undefined
      sourceType,
      intentLabel
    });

    // Route based on new fields if available, fall back to old
    const effectiveTimeType = meeting.timeType ||
      meetingTypeToNew(meeting.meetingType).timeType;
    const effectiveTargetType = meeting.targetType ||
      meetingTypeToNew(meeting.meetingType).targetType;

    // Create offers based on effective types
    if (effectiveTimeType === 'IMMEDIATE' && effectiveTargetType === 'OPEN') {
      // BROADCAST behavior
      await createParallelOffersForMeeting(meeting);
    } else if (effectiveTimeType === 'FUTURE' && effectiveTargetType === 'OPEN') {
      // ADVANCE behavior
      await processOfferForNewMeeting(meeting);
    }

    res.json({ meeting, message: "New meeting created!" });
  } catch (error) {
    console.error("Error creating meeting:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: "Internal server error", details: errorMessage });
  }
};
```

### Step 2.3: Test Dual-Write

**Create test cases:**
```typescript
// Test 1: Old API still works
POST /api/create-meeting
{
  "userFromId": "user-123",
  "scheduledFor": "2025-12-15T14:00:00Z",
  "scheduledEnd": "2025-12-15T15:00:00Z",
  "meetingType": "ADVANCE"
}
// Should write both meetingType=ADVANCE AND timeType=FUTURE, targetType=OPEN

// Test 2: New API works
POST /api/create-meeting
{
  "userFromId": "user-123",
  "scheduledFor": "2025-12-15T14:00:00Z",
  "scheduledEnd": "2025-12-15T15:00:00Z",
  "timeType": "FUTURE",
  "targetType": "FRIEND_SPECIFIC"  // NEW CAPABILITY!
}
// Should write both new fields AND derive meetingType=ADVANCE for compatibility
```

---

## Phase 3: Migrate Existing Data (Week 3)

### Step 3.1: Create Data Migration Script

**File:** `migrations/backfill-meeting-types.ts`

```typescript
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

async function backfillMeetingTypes() {
  console.log('Starting backfill of meeting types...');

  // Get all meetings without new fields
  const meetings = await prisma.meeting.findMany({
    where: {
      OR: [
        { timeType: null },
        { targetType: null }
      ]
    },
    select: {
      id: true,
      meetingType: true
    }
  });

  console.log(`Found ${meetings.length} meetings to backfill`);

  let updated = 0;

  for (const meeting of meetings) {
    let timeType: TimeType;
    let targetType: TargetType;

    // Map old MeetingType to new fields
    switch (meeting.meetingType) {
      case 'ADVANCE':
      case 'ADVANCE_PARALLEL':
        timeType = 'FUTURE';
        targetType = 'OPEN';
        break;
      case 'BROADCAST':
        timeType = 'IMMEDIATE';
        targetType = 'OPEN';
        break;
      default:
        console.warn(`Unknown meeting type for meeting ${meeting.id}: ${meeting.meetingType}`);
        continue;
    }

    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        timeType,
        targetType,
        sourceType: 'USER_INTENT'  // Default assumption
      }
    });

    updated++;

    if (updated % 100 === 0) {
      console.log(`Updated ${updated} meetings...`);
    }
  }

  console.log(`✅ Backfill complete! Updated ${updated} meetings`);
}

backfillMeetingTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Step 3.2: Run Migration

```bash
npx ts-node migrations/backfill-meeting-types.ts
```

### Step 3.3: Verify Migration

```sql
-- Check that all meetings now have new fields
SELECT
  "meetingType",
  "timeType",
  "targetType",
  COUNT(*)
FROM "meeting"
GROUP BY "meetingType", "timeType", "targetType";

-- Should show:
-- ADVANCE   | FUTURE    | OPEN | <count>
-- BROADCAST | IMMEDIATE | OPEN | <count>
```

### Step 3.4: Make New Fields Non-Nullable

**After successful backfill:**

```prisma
model Meeting {
  // ... other fields ...

  timeType          TimeType      // Remove the ? (no longer nullable)
  targetType        TargetType    // Remove the ? (no longer nullable)

  // ... rest of fields ...
}
```

**Create migration:**
```bash
npx prisma migrate dev --name make_new_fields_required
```

---

## Phase 4: Dual-Read & Refactor Business Logic (Week 4-6)

### Step 4.1: Update All Query Functions to Use New Fields

**File:** `backend/query/meeting-lookup.ts`

```typescript
// Before: Check meetingType
if (meeting.meetingType === 'BROADCAST') { ... }

// After: Check new fields (with fallback)
const timeType = meeting.timeType || meetingTypeToNew(meeting.meetingType).timeType;
const targetType = meeting.targetType || meetingTypeToNew(meeting.meetingType).targetType;

if (timeType === 'IMMEDIATE' && targetType === 'OPEN') { ... }
```

### Step 4.2: Update Business Logic Functions

**File:** `backend/process-meeting.ts`

**Before:**
```typescript
export const processOffersForMeeting = async (meeting: Meeting) => {
  if (meeting.meetingType === 'BROADCAST') {
    return processOffersForBroadcastMeeting(meeting);
  }
  // ... rest of ADVANCE logic
}
```

**After:**
```typescript
export const processOffersForMeeting = async (meeting: Meeting) => {
  const timeType = meeting.timeType;
  const targetType = meeting.targetType;

  // Route based on flexible types
  if (timeType === 'IMMEDIATE' && targetType === 'OPEN') {
    return processOffersForBroadcastMeeting(meeting);
  }

  if (timeType === 'FUTURE' && targetType === 'OPEN') {
    return processOffersForAdvanceMeeting(meeting);
  }

  if (targetType === 'FRIEND_SPECIFIC') {
    return processOffersForDirectMeeting(meeting);  // NEW!
  }

  // ... handle other combinations
}
```

### Step 4.3: Implement DRAFT State Handling

**New function for draft meetings:**

```typescript
// backend/update/meeting-update.ts

export const createDraftMeeting = async ({
  userFromId,
  scheduledFor,
  scheduledEnd,
  title,
  timeType,
  targetType,
  sourceType,
  intentLabel,
  targetUserId  // For FRIEND_SPECIFIC
}: {
  userFromId: string;
  scheduledFor?: Date;  // Optional for UNKNOWN time
  scheduledEnd?: Date;
  title?: string;
  timeType: TimeType;
  targetType: TargetType;
  sourceType?: SourceType;
  intentLabel?: string;
  targetUserId?: string;
}): Promise<Meeting> => {

  const meeting = await prisma.meeting.create({
    data: {
      userFromId,
      scheduledFor: scheduledFor || new Date(0),  // Placeholder for UNKNOWN
      scheduledEnd: scheduledEnd || new Date(0),
      title,
      timeType,
      targetType,
      sourceType,
      intentLabel,
      meetingState: 'DRAFT',  // Starts as DRAFT
      meetingType: newToMeetingType(timeType, targetType),  // For compat
    }
  });

  // Don't create offers yet - it's just a draft!
  return meeting;
};

export const activateDraftMeeting = async ({
  meetingId,
  scheduledFor,
  scheduledEnd
}: {
  meetingId: string;
  scheduledFor?: Date;
  scheduledEnd?: Date;
}): Promise<Meeting> => {

  const meeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      meetingState: 'SEARCHING',
      ...(scheduledFor && { scheduledFor }),
      ...(scheduledEnd && { scheduledEnd })
    },
    include: {
      broadcastMetadata: true
    }
  });

  // Now create offers since it's activated
  await createOffersForMeeting(meeting);

  return meeting;
};
```

### Step 4.4: Create New Endpoints

**File:** `endpoint-handlers/draft-meeting-handler.ts`

```typescript
export const handleCreateDraftMeeting = async (req: Request, res: Response) => {
  const {
    userFromId,
    scheduledFor,
    scheduledEnd,
    title,
    timeType,
    targetType,
    sourceType,
    intentLabel,
    targetUserId
  } = req.body;

  if (!timeType || !targetType) {
    return res.status(400).json({
      error: "timeType and targetType are required for draft meetings"
    });
  }

  try {
    const draft = await createDraftMeeting({
      userFromId,
      scheduledFor,
      scheduledEnd,
      title,
      timeType,
      targetType,
      sourceType,
      intentLabel,
      targetUserId
    });

    res.json({
      success: true,
      draft,
      message: "Draft meeting created"
    });
  } catch (error) {
    console.error("Error creating draft:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage
    });
  }
};

export const handleActivateDraft = async (req: Request, res: Response) => {
  const { meetingId, scheduledFor, scheduledEnd } = req.body;

  try {
    const meeting = await activateDraftMeeting({
      meetingId,
      scheduledFor,
      scheduledEnd
    });

    res.json({
      success: true,
      meeting,
      message: "Draft activated"
    });
  } catch (error) {
    console.error("Error activating draft:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage
    });
  }
};
```

**Register routes:**
```typescript
// app.ts
import { handleCreateDraftMeeting, handleActivateDraft } from './endpoint-handlers/draft-meeting-handler.js';

app.post('/api/create-draft-meeting', handleCreateDraftMeeting);
app.post('/api/activate-draft', handleActivateDraft);
```

---

## Phase 5: Deprecate Old System (Week 7-8)

### Step 5.1: Add Deprecation Warnings

```typescript
export const handleCreateMeeting = async (req: Request, res: Response) => {
  const { meetingType } = req.body;

  if (meetingType) {
    console.warn('⚠️ DEPRECATED: meetingType parameter is deprecated. Use timeType + targetType instead.');
    // Consider adding a response header
    res.setHeader('X-Deprecated-API', 'meetingType will be removed in v2.0');
  }

  // ... rest of handler
}
```

### Step 5.2: Update Documentation

Add migration guide for API consumers:

```markdown
## API Migration Guide

### Old API (Deprecated)
POST /api/create-meeting
{
  "meetingType": "ADVANCE"  ❌ DEPRECATED
}

### New API (Recommended)
POST /api/create-meeting
{
  "timeType": "FUTURE",     ✅ USE THIS
  "targetType": "OPEN"      ✅ USE THIS
}
```

### Step 5.3: Monitor Usage

Add analytics to track old vs new API usage:

```typescript
// Track API usage
if (meetingType) {
  metrics.increment('api.create_meeting.old_format');
} else {
  metrics.increment('api.create_meeting.new_format');
}
```

---

## Phase 6: Remove Old System (Week 9+)

**Only after:**
- ✅ All clients migrated to new API
- ✅ Old API usage drops to 0% for 2+ weeks
- ✅ Team consensus

### Step 6.1: Remove MeetingType Column

```prisma
model Meeting {
  // Remove this line:
  // meetingType       MeetingType         @default(ADVANCE)

  // Keep only new fields
  timeType          TimeType
  targetType        TargetType
  sourceType        SourceType?
  intentLabel       String?
}
```

### Step 6.2: Remove MeetingType Enum

```prisma
// Delete this entire enum:
// enum MeetingType {
//   ADVANCE
//   BROADCAST
//   ADVANCE_PARALLEL
// }
```

### Step 6.3: Create Final Migration

```bash
npx prisma migrate dev --name remove_meeting_type
```

### Step 6.4: Remove Helper Functions

Delete migration helpers from `types.ts`:
- `meetingTypeToNew()`
- `newToMeetingType()`

### Step 6.5: Update All Code

Remove all references to `meetingType` in business logic.

---

## Testing Strategy During Migration

### Unit Tests
```typescript
describe('Meeting Type Migration', () => {
  it('should correctly map ADVANCE to new types', () => {
    const result = meetingTypeToNew('ADVANCE');
    expect(result).toEqual({
      timeType: 'FUTURE',
      targetType: 'OPEN'
    });
  });

  it('should correctly map new types back to BROADCAST', () => {
    const result = newToMeetingType('IMMEDIATE', 'OPEN');
    expect(result).toBe('BROADCAST');
  });
});
```

### Integration Tests
```typescript
describe('Dual-Write During Migration', () => {
  it('should write both old and new fields when using old API', async () => {
    const response = await request(app)
      .post('/api/create-meeting')
      .send({
        userFromId: 'user-123',
        scheduledFor: '2025-12-15T14:00:00Z',
        scheduledEnd: '2025-12-15T15:00:00Z',
        meetingType: 'ADVANCE'
      });

    expect(response.body.meeting.meetingType).toBe('ADVANCE');
    expect(response.body.meeting.timeType).toBe('FUTURE');
    expect(response.body.meeting.targetType).toBe('OPEN');
  });

  it('should support new DRAFT state', async () => {
    const response = await request(app)
      .post('/api/create-draft-meeting')
      .send({
        userFromId: 'user-123',
        timeType: 'UNKNOWN',
        targetType: 'FRIEND_SPECIFIC',
        title: 'Coffee sometime?'
      });

    expect(response.body.draft.meetingState).toBe('DRAFT');
    expect(response.body.draft.timeType).toBe('UNKNOWN');
  });
});
```

---

## Rollback Plan

### If Issues Arise in Phase 2-3:
```sql
-- Rollback: Set new fields to NULL
UPDATE "meeting"
SET "timeType" = NULL, "targetType" = NULL, "sourceType" = NULL
WHERE "timeType" IS NOT NULL;

-- System will fall back to using meetingType
```

### If Issues Arise in Phase 4-5:
```typescript
// Temporarily revert business logic to check meetingType first
const effectiveTimeType = meeting.meetingType === 'BROADCAST'
  ? 'IMMEDIATE'
  : (meeting.timeType || 'FUTURE');
```

### Emergency Rollback (Nuclear Option):
```bash
# Revert to migration before new fields were added
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Timeline Summary

| Phase | Duration | Key Milestone | Rollback Risk |
|-------|----------|---------------|---------------|
| Phase 1 | Week 1-2 | Schema updated, new fields added | ✅ Low (additive only) |
| Phase 2 | Week 2-3 | Dual-write implemented | ⚠️ Medium |
| Phase 3 | Week 3 | Existing data migrated | ⚠️ Medium (can revert) |
| Phase 4 | Week 4-6 | Business logic refactored | 🔴 High (extensive changes) |
| Phase 5 | Week 7-8 | Old API deprecated | ⚠️ Medium |
| Phase 6 | Week 9+ | Old system removed | 🔴 High (irreversible) |

**Total estimated time:** 9-12 weeks for complete migration

**Recommended approach:** Pause 1 week between phases for monitoring

---

## Success Criteria

Before moving to next phase:

### Phase 1 ✓
- [ ] All new enums created
- [ ] All new fields nullable in schema
- [ ] Migration runs successfully
- [ ] No errors in production

### Phase 2 ✓
- [ ] createMeeting accepts both old and new parameters
- [ ] Both fields are written to database
- [ ] Old API still works 100%
- [ ] New API works for basic cases

### Phase 3 ✓
- [ ] 100% of existing meetings have new fields
- [ ] Verification queries pass
- [ ] New fields are non-nullable
- [ ] No data loss

### Phase 4 ✓
- [ ] All business logic uses new fields (with fallbacks)
- [ ] DRAFT state working
- [ ] New meeting types (FRIEND_SPECIFIC, UNKNOWN) work
- [ ] Test coverage >75%

### Phase 5 ✓
- [ ] Deprecation warnings in place
- [ ] Usage metrics show <10% old API usage
- [ ] Documentation updated
- [ ] Communication sent to API consumers

### Phase 6 ✓
- [ ] Old API usage at 0% for 2+ weeks
- [ ] All clients confirmed migrated
- [ ] MeetingType removed successfully
- [ ] All tests pass

---

## Risk Mitigation

### High-Risk Areas

1. **Offer Distribution Logic**
   - Risk: Complex logic depends on MeetingType
   - Mitigation: Extensive testing, gradual rollout

2. **Broadcast State Machine**
   - Risk: BroadcastMetadata tightly coupled to BROADCAST type
   - Mitigation: Keep BroadcastMetadata logic separate, check timeType + targetType instead

3. **Client Apps**
   - Risk: Mobile apps may cache old API format
   - Mitigation: Support both APIs for 3+ months, versioned endpoints

4. **Database Performance**
   - Risk: Additional fields may impact query performance
   - Mitigation: Index new fields, monitor query times

### Monitoring During Migration

```typescript
// Add comprehensive logging
logger.info('Meeting created', {
  meetingId: meeting.id,
  usedOldApi: !!meetingType,
  usedNewApi: !!timeType && !!targetType,
  timeType: meeting.timeType,
  targetType: meeting.targetType,
  oldMeetingType: meeting.meetingType
});
```

---

## Communication Plan

### Week Before Phase 1
- Announce migration plan to team
- Review this document in team meeting
- Identify any concerns

### Start of Each Phase
- Post in team channel: "Starting Phase X of meeting migration"
- Update status board
- Review success criteria

### Issues During Migration
- Immediately notify team
- Assess severity (can we continue or pause?)
- Document learnings

---

*Migration Plan Created: 2025-12-11*
*Ready for team review and approval*
