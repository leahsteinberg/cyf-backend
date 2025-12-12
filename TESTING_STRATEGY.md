# Backend Testing Strategy

## Current State
- ❌ No tests currently exist
- ❌ No testing framework installed
- ✅ TypeScript backend with clear separation of concerns (handlers, business logic, queries/updates)

---

## Recommended Testing Approaches

### 📊 Testing Pyramid Strategy

```
         /\
        /  \  E2E Tests (Few - 10%)
       /----\
      /      \  Integration Tests (Some - 30%)
     /--------\
    /          \  Unit Tests (Many - 60%)
   /__________\
```

---

## Approach 1: **Vitest + Supertest** (RECOMMENDED)

### Why This Approach?
- ✅ **Fast**: Vitest is 10x faster than Jest for TypeScript
- ✅ **TypeScript-first**: Better TS support out of the box
- ✅ **Modern**: Built on Vite, better DX
- ✅ **Compatible**: Drop-in Jest replacement (same API)
- ✅ **Supertest**: Industry standard for HTTP testing

### Setup

#### Dependencies to Install
```bash
npm install -D vitest @vitest/ui supertest @types/supertest
npm install -D @testcontainers/postgresql  # For isolated DB tests
```

#### Test Structure
```
tests/
├── unit/                    # Pure function tests (fast)
│   ├── utils.test.ts
│   ├── business-logic/
│   │   ├── offer-expiration.test.ts
│   │   └── broadcast-validation.test.ts
│   └── query/
│       └── meeting-lookup.test.ts
├── integration/             # API endpoint tests (medium speed)
│   ├── auth.integration.test.ts
│   ├── meeting.integration.test.ts
│   ├── broadcast.integration.test.ts
│   └── offer.integration.test.ts
├── e2e/                     # Full user flow tests (slow)
│   ├── create-meeting-flow.e2e.test.ts
│   └── broadcast-flow.e2e.test.ts
└── helpers/
    ├── test-db.ts          # Database setup/teardown
    ├── test-users.ts       # User fixtures
    └── test-server.ts      # Express app setup
```

---

## Approach 2: **Jest + Supertest** (TRADITIONAL)

### Why This Approach?
- ✅ **Industry standard**: Most documentation/examples
- ✅ **Mature ecosystem**: More plugins and resources
- ✅ **Familiar**: Most developers know Jest
- ⚠️ **Slower**: TypeScript requires babel/ts-jest
- ⚠️ **More config**: Needs more setup for TS

### Dependencies
```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install -D @testcontainers/postgresql
```

---

## Approach 3: **Minimal (Node Test Runner)** (SIMPLEST)

### Why This Approach?
- ✅ **Zero dependencies**: Built into Node 20+
- ✅ **Simple**: No config needed
- ⚠️ **Limited features**: No mocking, snapshots, etc.
- ⚠️ **Less mature**: Newer, less ecosystem support

### Use Case
Good for quick smoke tests or if you want absolute simplicity.

---

## Test Database Strategies

### Option A: **Testcontainers** (RECOMMENDED FOR CI/CD)
```typescript
// tests/helpers/test-db.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export async function setupTestDb() {
  const container = await new PostgreSqlContainer()
    .withDatabase('test_db')
    .start();

  process.env.DATABASE_URL = container.getConnectionUri();

  // Run migrations
  execSync('npx prisma migrate deploy');

  return container;
}
```

**Pros:**
- ✅ Isolated database per test run
- ✅ No conflicts between developers
- ✅ Works in CI/CD
- ✅ Real PostgreSQL (not mocks)

**Cons:**
- ⚠️ Requires Docker
- ⚠️ Slower startup (but can reuse container)

---

### Option B: **Separate Test Database** (SIMPLER)
```typescript
// tests/helpers/test-db.ts
import { PrismaClient } from '../generated/prisma/client';

export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL
});

export async function resetDatabase() {
  await testPrisma.$executeRaw`TRUNCATE TABLE "meeting", "offer", "user" CASCADE`;
}
```

**Setup:**
```env
# .env.test
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/cyf_test"
```

**Pros:**
- ✅ Simple setup
- ✅ Fast (no container startup)
- ✅ Easy to inspect manually

**Cons:**
- ⚠️ Need to manage separate DB
- ⚠️ Parallel tests can conflict
- ⚠️ Requires local PostgreSQL

---

### Option C: **Transaction Rollback** (FASTEST)
```typescript
// Each test runs in a transaction that gets rolled back
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});
```

**Pros:**
- ✅ Blazing fast
- ✅ Automatic cleanup
- ✅ No container overhead

**Cons:**
- ⚠️ Tests share DB (can have race conditions)
- ⚠️ Doesn't test transaction logic in code

---

## What to Test (Priority Order)

### 🔴 **High Priority - Critical Business Logic**

1. **Meeting Creation & Time Conflicts**
   - ✅ Can't create overlapping meetings
   - ✅ Can't create duplicate broadcasts
   - ✅ Proper expiration time calculation

2. **Offer Distribution**
   - ✅ ADVANCE: Sequential offer creation
   - ✅ BROADCAST: All friends get offers
   - ✅ Accepting one offer expires others (ADVANCE_PARALLEL)

3. **Broadcast State Machine**
   - ✅ UNCLAIMED → PENDING_CLAIMED → CLAIMED
   - ✅ Cancellation returns to UNCLAIMED
   - ✅ Only one user can claim

4. **Authentication & Authorization**
   - ✅ Can't accept others' offers
   - ✅ Can't cancel others' broadcasts
   - ✅ Session management

### 🟡 **Medium Priority - Important Features**

5. **Friendship System**
   - ✅ Can add/remove friends
   - ✅ Offers only go to friends
   - ✅ Invitation flow

6. **Meeting State Transitions**
   - ✅ SEARCHING → ACCEPTED/REJECTED/PAST
   - ✅ Cron job marks past meetings
   - ✅ Offer expiration handling

### 🟢 **Low Priority - Nice to Have**

7. **Edge Cases**
   - ✅ Timezone handling
   - ✅ Empty friend lists
   - ✅ Concurrent acceptance attempts

8. **Performance**
   - ✅ Query efficiency
   - ✅ N+1 queries detection

---

## Example Test Files

### Unit Test Example
```typescript
// tests/unit/business-logic/offer-expiration.test.ts
import { describe, it, expect } from 'vitest';
import { determineOfferExpiration } from '../../backend/process-meeting';

describe('determineOfferExpiration', () => {
  it('should expire at meeting time when no friends remain', async () => {
    const meetingTime = new Date('2025-12-15T14:00:00Z');

    const expiration = await determineOfferExpiration({
      meetingTime,
      userToOfferId: 'user-123',
      remainingFriendsCount: 0
    });

    expect(expiration).toEqual(meetingTime);
  });

  it('should split time equally between friends', async () => {
    const now = new Date('2025-12-15T10:00:00Z');
    const meetingTime = new Date('2025-12-15T14:00:00Z'); // 4 hours away

    const expiration = await determineOfferExpiration({
      meetingTime,
      userToOfferId: 'user-123',
      remainingFriendsCount: 4  // Should get ~1 hour each
    });

    const diffMinutes = (expiration.getTime() - now.getTime()) / (1000 * 60);
    expect(diffMinutes).toBeCloseTo(60, -1); // ~60 minutes
  });
});
```

### Integration Test Example
```typescript
// tests/integration/meeting.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { setupTestDb, teardownTestDb, resetDb } from '../helpers/test-db';
import { createTestUser } from '../helpers/test-users';

describe('Meeting API', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it('should create a new ADVANCE meeting', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'password123'
    });

    const response = await request(app)
      .post('/api/create-meeting')
      .send({
        userFromId: user.id,
        scheduledFor: '2025-12-15T14:00:00Z',
        scheduledEnd: '2025-12-15T15:00:00Z',
        title: 'Test Meeting'
      })
      .expect(200);

    expect(response.body.meeting).toBeDefined();
    expect(response.body.meeting.meetingType).toBe('ADVANCE');
    expect(response.body.meeting.meetingState).toBe('SEARCHING');
  });

  it('should prevent overlapping meetings', async () => {
    const user = await createTestUser();

    // Create first meeting
    await request(app)
      .post('/api/create-meeting')
      .send({
        userFromId: user.id,
        scheduledFor: '2025-12-15T14:00:00Z',
        scheduledEnd: '2025-12-15T15:00:00Z',
        title: 'First Meeting'
      })
      .expect(200);

    // Try to create overlapping meeting
    const response = await request(app)
      .post('/api/create-meeting')
      .send({
        userFromId: user.id,
        scheduledFor: '2025-12-15T14:30:00Z',  // Overlaps!
        scheduledEnd: '2025-12-15T15:30:00Z',
        title: 'Second Meeting'
      })
      .expect(409);

    expect(response.body.error).toContain('already have a meeting');
  });
});
```

### E2E Test Example
```typescript
// tests/e2e/broadcast-flow.e2e.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { createTestUser, createFriendship } from '../helpers/test-users';

describe('Broadcast Flow E2E', () => {
  it('should complete full broadcast lifecycle', async () => {
    // Setup: Create broadcaster and 3 friends
    const broadcaster = await createTestUser({ name: 'Broadcaster' });
    const friend1 = await createTestUser({ name: 'Friend 1' });
    const friend2 = await createTestUser({ name: 'Friend 2' });
    const friend3 = await createTestUser({ name: 'Friend 3' });

    await createFriendship(broadcaster.id, friend1.id);
    await createFriendship(broadcaster.id, friend2.id);
    await createFriendship(broadcaster.id, friend3.id);

    // Step 1: Broadcaster creates broadcast
    const createResponse = await request(app)
      .post('/api/broadcast-now')
      .send({ userId: broadcaster.id })
      .expect(200);

    const meetingId = createResponse.body.meeting.id;

    // Step 2: Verify all friends got offers
    const friend1Offers = await request(app)
      .get('/api/offers')
      .query({ userId: friend1.id })
      .expect(200);

    expect(friend1Offers.body.offers).toHaveLength(1);
    expect(friend1Offers.body.offers[0].meetingId).toBe(meetingId);

    // Step 3: Friend1 tries to accept (pending claim)
    const tryAcceptResponse = await request(app)
      .post('/api/try-accept-broadcast')
      .send({
        userId: friend1.id,
        offerId: friend1Offers.body.offers[0].id
      })
      .expect(200);

    expect(tryAcceptResponse.body.meeting.broadcastMetadata.subState)
      .toBe('PENDING_CLAIMED');

    // Step 4: Friend1 confirms acceptance
    await request(app)
      .post('/api/accept-broadcast')
      .send({
        userId: friend1.id,
        offerId: friend1Offers.body.offers[0].id
      })
      .expect(200);

    // Step 5: Verify friend2 and friend3 offers are expired
    const friend2Offers = await request(app)
      .get('/api/offers')
      .query({ userId: friend2.id })
      .expect(200);

    expect(friend2Offers.body.offers).toHaveLength(0); // No open offers

    // Step 6: Verify meeting is accepted
    const meeting = await request(app)
      .get('/api/meeting')
      .query({ meetingId })
      .expect(200);

    expect(meeting.body.meeting.meetingState).toBe('ACCEPTED');
    expect(meeting.body.meeting.acceptedUserId).toBe(friend1.id);
  });
});
```

---

## Test Helper Files

### Database Helper
```typescript
// tests/helpers/test-db.ts
import { PrismaClient } from '../../generated/prisma/client';
import { execSync } from 'child_process';

let testPrisma: PrismaClient;

export async function setupTestDb() {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/cyf_test';

  testPrisma = new PrismaClient();

  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  });

  return testPrisma;
}

export async function resetDb() {
  const tables = ['Meeting', 'Offer', 'BroadcastMetadata', 'Friendship', 'Invitation', 'User'];

  for (const table of tables) {
    await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

export async function teardownTestDb() {
  await testPrisma.$disconnect();
}

export { testPrisma };
```

### User Helper
```typescript
// tests/helpers/test-users.ts
import { testPrisma } from './test-db';
import crypto from 'crypto';

export async function createTestUser(data?: Partial<User>) {
  const randomId = crypto.randomUUID();

  return await testPrisma.user.create({
    data: {
      id: data?.id || crypto.randomUUID(),
      email: data?.email || `test-${randomId}@example.com`,
      name: data?.name || 'Test User',
      emailVerified: true,
      phoneNumber: data?.phoneNumber || `+1555${Math.random().toString().slice(2, 9)}`,
      ...data
    }
  });
}

export async function createFriendship(userId1: string, userId2: string) {
  return await testPrisma.friendship.create({
    data: {
      userId1,
      userId2
    }
  });
}
```

---

## Configuration Files

### Vitest Config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.ts'
      ]
    },
    testTimeout: 10000,  // 10 seconds for integration tests
  }
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cyf_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cyf_test
        run: npx prisma migrate deploy

      - name: Run tests
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cyf_test
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Mocking Strategy

### When to Mock vs Real Data

**✅ Use Real Database For:**
- Integration tests
- E2E tests
- Query/update function tests

**✅ Mock External Services:**
```typescript
// Mock Twilio
vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'test-sid' })
    }
  }))
}));

// Mock Expo push notifications
vi.mock('expo-server-sdk', () => ({
  Expo: vi.fn(() => ({
    sendPushNotificationsAsync: vi.fn().mockResolvedValue([])
  }))
}));
```

**✅ Mock Time:**
```typescript
import { vi } from 'vitest';

vi.useFakeTimers();
vi.setSystemTime(new Date('2025-12-15T10:00:00Z'));

// ... run tests ...

vi.useRealTimers();
```

---

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical endpoints
- **E2E Tests**: Happy paths + critical error cases

**Track with:**
```bash
npm run test:coverage
```

**Enforce in CI:**
```json
// package.json
{
  "vitest": {
    "coverage": {
      "thresholds": {
        "lines": 80,
        "functions": 80,
        "branches": 75
      }
    }
  }
}
```

---

## Recommended Implementation Order

### Phase 1: Foundation (Week 1)
1. Install Vitest + Supertest
2. Setup test database helper
3. Write 3-5 unit tests for pure functions
4. Get CI/CD running

### Phase 2: Integration (Week 2)
5. Write integration tests for Meeting endpoints
6. Write integration tests for Broadcast endpoints
7. Write integration tests for Offer endpoints
8. Add test coverage reporting

### Phase 3: E2E (Week 3)
9. Write 2-3 complete user flow tests
10. Add authentication tests
11. Achieve 70%+ coverage

### Phase 4: Ongoing
12. Add tests for new features (test-first!)
13. Maintain coverage above 75%
14. Review and improve slow tests

---

## Cost-Benefit Analysis

| Approach | Setup Time | Maintenance | Speed | CI/CD Friendly | Recommended For |
|----------|-----------|-------------|-------|----------------|-----------------|
| **Vitest + Testcontainers** | Medium | Low | Fast | ✅ Yes | Production apps |
| **Jest + Separate DB** | Low | Medium | Medium | ⚠️ Requires setup | Quick start |
| **Node Test Runner** | Very Low | High | Fast | ✅ Yes | Simple projects |

---

## My Recommendation

**Go with Vitest + Supertest + Testcontainers**

**Why:**
1. ✅ Fast iteration (important for TDD)
2. ✅ Modern tooling (will age well)
3. ✅ Great CI/CD support
4. ✅ Isolated tests (no conflicts)
5. ✅ Your codebase is well-structured for testing

**Start Small:**
1. Install Vitest
2. Write 5 unit tests
3. Write 2 integration tests
4. Expand from there

**Don't Boil the Ocean:**
- Don't try to test everything at once
- Focus on critical paths first
- Add tests as you add features

---

*Document created: 2025-12-11*
*Ready for implementation when you are!*
