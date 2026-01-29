/**
 * Mock Express Request and Response
 *
 * Simple mocks that capture what handlers do without real HTTP.
 */

import type { Request, Response } from 'express';

/**
 * Creates a mock Express Request object
 */
export function createMockRequest(body: Record<string, unknown> = {}): Partial<Request> {
  return {
    body,
    params: {},
    query: {},
  };
}

/**
 * Creates a mock Express Response object with tracking
 */
export function createMockResponse(): {
  res: Partial<Response>;
  getStatus: () => number;
  getBody: () => unknown;
  getJson: () => unknown;
} {
  let statusCode = 200;
  let responseBody: unknown = null;

  const res: Partial<Response> = {
    status: jest.fn(function (this: Response, code: number) {
      statusCode = code;
      return this;
    }) as unknown as Response['status'],

    json: jest.fn((data: unknown) => {
      responseBody = data;
      return res as Response;
    }) as unknown as Response['json'],

    send: jest.fn((data: unknown) => {
      responseBody = data;
      return res as Response;
    }) as unknown as Response['send'],
  };

  return {
    res,
    getStatus: () => statusCode,
    getBody: () => responseBody,
    getJson: () => responseBody,
  };
}

/**
 * Helper to test endpoint handlers
 *
 * Usage:
 *   const { res, getStatus, getJson } = createMockResponse();
 *   await handleGetMeetings(createMockRequest({ userFromId: 'abc' }), res);
 *   expect(getStatus()).toBe(200);
 *   expect(getJson()).toMatchObject({ ... });
 */
