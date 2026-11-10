import { expect } from 'vitest';

import { ApiResponse } from '../support/http-client';

/**
 * Low-level expectations shared by the resource drivers.
 *
 * This is the only file that imports expect. Spec files contain no expect()
 * calls, no status codes and no JSON field paths, and neither do DSL modules.
 *
 * Failure messages carry what was being done, what was expected, and the
 * method, path, status and raw body that actually came back.
 */

const MAX_BODY_IN_MESSAGE = 500;

function truncate(text: string): string {
  return text.length > MAX_BODY_IN_MESSAGE
    ? `${text.slice(0, MAX_BODY_IN_MESSAGE)}... (truncated)`
    : text;
}

function describeResponse(response: ApiResponse): string {
  const body = response.rawBody === '' ? '<empty body>' : truncate(response.rawBody);
  return `${response.method} ${response.path} -> ${response.status}\n  body: ${body}`;
}

function failureMessage(what: string, expectation: string, response: ApiResponse): string {
  return `${what}\n  expected: ${expectation}\n  actual:   ${describeResponse(response)}`;
}

export function expectStatus(response: ApiResponse, expected: number, what: string): void {
  expect(
    response.status,
    failureMessage(what, `status ${expected}`, response)
  ).toBe(expected);

  if (expected >= 400) {
    expectNoInternals(response, what);
  }
}

/**
 * An error body says what went wrong and nothing about how: no wrapped causes,
 * and no debug parameters, which carry SQL, query params and request bodies.
 * Every error status a driver expects is checked, so each rejection test
 * guards it.
 */
function expectNoInternals(response: ApiResponse, what: string): void {
  for (const field of [ '"cause"', '"debugParams"', ]) {
    expect(
      response.rawBody.includes(field),
      failureMessage(what, `an error body with no ${field} field`, response)
    ).toBe(false);
  }
}

/**
 * A rejection, and the reason for it. The foreign keys answer 409 on their own,
 * so the status alone cannot show that the service's check is what rejected it.
 */
export function expectRejection(response: ApiResponse, expected: number, reason: string, what: string): void {
  expectStatus(response, expected, what);

  expect(
    response.rawBody.includes(reason),
    failureMessage(what, `a reason mentioning "${reason}"`, response)
  ).toBe(true);
}

function asRecord(response: ApiResponse, what: string): Record<string, unknown> {
  expect(
    typeof response.body === 'object' && response.body !== null && !Array.isArray(response.body),
    failureMessage(what, 'a JSON object body', response)
  ).toBe(true);

  return response.body as Record<string, unknown>;
}

function asArray(response: ApiResponse, what: string): Record<string, unknown>[] {
  expect(
    Array.isArray(response.body),
    failureMessage(what, 'a JSON array body', response)
  ).toBe(true);

  return response.body as Record<string, unknown>[];
}

export function expectBodyToContain(
  response: ApiResponse,
  expectedFields: Record<string, unknown>,
  what: string
): void {
  const body = asRecord(response, what);

  for (const [ key, value, ] of Object.entries(expectedFields)) {
    expect(
      body[key],
      failureMessage(what, `${key} = ${JSON.stringify(value)}`, response)
    ).toEqual(value);
  }
}

export function expectBodyToHaveKeys(response: ApiResponse, keys: string[], what: string): void {
  const body = asRecord(response, what);

  for (const key of keys) {
    expect(
      Object.prototype.hasOwnProperty.call(body, key),
      failureMessage(what, `a "${key}" property`, response)
    ).toBe(true);
  }
}

export function expectNoHeader(response: ApiResponse, name: string, what: string): void {
  const value = response.headers[name.toLowerCase()];

  expect(
    value,
    failureMessage(what, `no ${name} header, but it was "${value}"`, response)
  ).toBeUndefined();
}

export function expectListEntries(response: ApiResponse, what: string): Record<string, unknown>[] {
  return asArray(response, what);
}

export function expectNonEmptyString(value: unknown, response: ApiResponse, what: string): string {
  expect(
    typeof value === 'string' && value.length > 0,
    failureMessage(what, 'a non-empty string', response)
  ).toBe(true);

  return value as string;
}

/**
 * For conditions a driver has already worked out from the body. `expectation`
 * describes what should have been true, in words.
 */
export function expectThat(
  condition: boolean,
  expectation: string,
  response: ApiResponse,
  what: string
): void {
  expect(
    condition,
    failureMessage(what, expectation, response)
  ).toBe(true);
}

export function expectCount(actual: number, expected: number, response: ApiResponse, what: string): void {
  expect(
    actual,
    failureMessage(what, `${expected} entries`, response)
  ).toBe(expected);
}

/** An audit time, as the service writes it: UTC, to the second. */
const AUDIT_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/** How far an audit time just written may be from this machine's clock. */
const RECENT_MS = 5 * 60 * 1000;

export function expectAuditTimestamp(value: unknown, field: string, response: ApiResponse, what: string): void {
  expect(
    typeof value === 'string' && AUDIT_TIMESTAMP.test(value),
    failureMessage(what, `${field} in UTC, as YYYY-MM-DDTHH:mm:ssZ, not ${JSON.stringify(value)}`, response)
  ).toBe(true);
}

/**
 * An audit time the service has only just written is within a few minutes of now. Against a
 * database whose time zone matches the service's this holds either way; it catches an audit time
 * read in the wrong zone, which is hours out.
 */
export function expectRecentTimestamp(value: unknown, field: string, response: ApiResponse, what: string): void {
  const written = typeof value === 'string' ? Date.parse(value) : Number.NaN;

  expect(
    Math.abs(Date.now() - written) <= RECENT_MS,
    failureMessage(what, `${field} within 5 minutes of now (${new Date().toISOString()}), not ${JSON.stringify(value)}`, response)
  ).toBe(true);
}

/** For the one check with no response to report on: a step rejected by the DSL. */
export function expectTrue(condition: boolean, message: string): void {
  expect(condition, message).toBe(true);
}
