import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock objects — defined before jest.unstable_mockModule so the factory
// can reference them (unstable_mockModule is NOT hoisted, unlike jest.mock).
// ---------------------------------------------------------------------------

const mockTx = {
  meeting: {
    findMany: jest.fn<() => Promise<{ id: string }[]>>(),
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  broadcastMetadata: {
    deleteMany: jest.fn<() => Promise<unknown>>(),
    updateMany: jest.fn<() => Promise<unknown>>(),
  },
  offer: {
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  userSignal: {
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  friendship: {
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  invitation: {
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  friendGroup: {
    deleteMany: jest.fn<() => Promise<unknown>>(),
  },
  user: {
    delete: jest.fn<() => Promise<unknown>>(),
  },
  $queryRaw: jest.fn<() => Promise<unknown>>(),
};

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)),
};

const mockGetSession = jest.fn();

jest.unstable_mockModule('../../backend/auth.js', () => ({
  auth: { api: { getSession: mockGetSession } },
  prisma: mockPrisma,
}));

jest.unstable_mockModule('better-auth/node', () => ({
  fromNodeHeaders: jest.fn((h: unknown) => h),
}));

// Dynamic imports must come after unstable_mockModule calls
const { deleteUser } = await import('../../backend/update/user-update.js');
const { handleDeleteUser } = await import('../../endpoint-handlers/user-handler.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRes() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res as any);
  return res;
}

// ---------------------------------------------------------------------------
// deleteUser
// ---------------------------------------------------------------------------

describe('deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
    );
    mockTx.meeting.findMany.mockResolvedValue([{ id: 'meeting-1' }, { id: 'meeting-2' }]);
  });

  it('wraps all operations in a transaction', async () => {
    await deleteUser({ userId: 'user-123' });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('deletes broadcast metadata for the user\'s meetings before any offers', async () => {
    const order: string[] = [];
    mockTx.broadcastMetadata.deleteMany.mockImplementation(async () => { order.push('bm.deleteMany'); });
    mockTx.offer.deleteMany.mockImplementation(async () => { order.push('offer.deleteMany'); });

    await deleteUser({ userId: 'user-123' });

    expect(order.indexOf('bm.deleteMany')).toBeLessThan(order.indexOf('offer.deleteMany'));
  });

  it('nulls out offerClaimedId on other broadcasts before deleting received offers', async () => {
    const order: string[] = [];
    mockTx.broadcastMetadata.updateMany.mockImplementation(async () => { order.push('bm.updateMany'); });
    mockTx.offer.deleteMany.mockImplementation(async () => { order.push('offer.deleteMany'); });

    await deleteUser({ userId: 'user-123' });

    expect(order.indexOf('bm.updateMany')).toBeLessThan(order.indexOf('offer.deleteMany'));
  });

  it('deletes offers before deleting meetings', async () => {
    const order: string[] = [];
    mockTx.offer.deleteMany.mockImplementation(async () => { order.push('offer.deleteMany'); });
    mockTx.meeting.deleteMany.mockImplementation(async () => { order.push('meeting.deleteMany'); });

    await deleteUser({ userId: 'user-123' });

    expect(order.indexOf('offer.deleteMany')).toBeLessThan(order.indexOf('meeting.deleteMany'));
  });

  it('removes user from accepted meetings via raw SQL', async () => {
    await deleteUser({ userId: 'user-123' });
    expect(mockTx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('deletes friendships in both directions', async () => {
    await deleteUser({ userId: 'user-123' });
    expect(mockTx.friendship.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ userId1: 'user-123' }, { userId2: 'user-123' }] },
    });
  });

  it('deletes the user record last', async () => {
    const order: string[] = [];
    mockTx.friendship.deleteMany.mockImplementation(async () => { order.push('friendship.deleteMany'); });
    mockTx.invitation.deleteMany.mockImplementation(async () => { order.push('invitation.deleteMany'); });
    mockTx.friendGroup.deleteMany.mockImplementation(async () => { order.push('friendGroup.deleteMany'); });
    mockTx.user.delete.mockImplementation(async () => { order.push('user.delete'); });

    await deleteUser({ userId: 'user-123' });

    expect(order[order.length - 1]).toBe('user.delete');
  });

  it('skips meeting-scoped broadcast and offer deletes when user has no meetings', async () => {
    mockTx.meeting.findMany.mockResolvedValue([]);

    await deleteUser({ userId: 'user-456' });

    const broadcastDeleteCalls = (mockTx.broadcastMetadata.deleteMany as jest.MockedFunction<any>).mock.calls;
    const meetingScopedCalls = broadcastDeleteCalls.filter(
      (call: unknown[]) => (call[0] as any)?.where?.meetingId !== undefined
    );
    expect(meetingScopedCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// handleDeleteUser
// ---------------------------------------------------------------------------

describe('handleDeleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)
    );
    mockTx.meeting.findMany.mockResolvedValue([]);
  });

  it('returns 401 when there is no session', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = makeRes();

    await handleDeleteUser({ headers: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns 401 when session has no user id', async () => {
    mockGetSession.mockResolvedValue({ user: null });
    const res = makeRes();

    await handleDeleteUser({ headers: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('deletes the authenticated user and returns success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    const res = makeRes();

    await handleDeleteUser({ headers: {} } as any, res as any);

    expect(mockTx.user.delete).toHaveBeenCalledWith({ where: { id: 'user-123' } });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns 500 when deletion throws', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockPrisma.$transaction.mockRejectedValue(new Error('DB connection lost'));
    const res = makeRes();

    await handleDeleteUser({ headers: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Failed to delete account', details: 'DB connection lost' })
    );
  });
});
