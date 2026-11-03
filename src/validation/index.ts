import { Request } from 'express';

import { BadRequestError } from '../errors/common';

/**
 * Checks for values that come from a request: a body field, a route param or a
 * query param. Each returns the checked value, or throws a BadRequestError that
 * names the field, so the client is told which input to fix.
 *
 * Numbers may arrive as numeric strings ("2026"): route and query params always
 * do, and the app sends some body fields that way. Anything else is rejected.
 */

export interface IntegerOptions {
  min?: number,
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null;
}

function toInteger(value: unknown, field: string, options: IntegerOptions): number {
  let parsed = Number.NaN;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    parsed = Number(value);
  }

  if (!Number.isSafeInteger(parsed)) {
    throw new BadRequestError(`${field} must be an integer`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new BadRequestError(`${field} must be at least ${options.min}`);
  }

  return parsed;
}

export function requiredInteger(value: unknown, field: string, options: IntegerOptions = {}): number {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  return toInteger(value, field, options);
}

export function optionalInteger(value: unknown, field: string, options: IntegerOptions = {}): number | undefined {
  return isMissing(value) ? undefined : toInteger(value, field, options);
}

/** A planting year, wherever it comes from. */
export function requiredYear(value: unknown, field: string): number {
  return requiredInteger(value, field, { min: 1, });
}

/** The most a TEXT column holds, in bytes. */
export const TEXT_BYTES = 65535;

export interface StringOptions {
  /** In characters, for a VARCHAR(n) column, which counts characters. */
  maxLength?: number,
  /** In UTF-8 bytes, for a TEXT column, which counts bytes. */
  maxBytes?: number,
}

function toCheckedString(value: unknown, field: string, options: StringOptions): string {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be a string`);
  }
  if (options.maxLength !== undefined && [ ...value, ].length > options.maxLength) {
    throw new BadRequestError(`${field} must be at most ${options.maxLength} characters`);
  }
  if (options.maxBytes !== undefined && Buffer.byteLength(value, 'utf8') > options.maxBytes) {
    throw new BadRequestError(`${field} must be at most ${options.maxBytes} bytes`);
  }

  return value;
}

/** A string with something in it: missing, empty and blank are all "required". */
export function requiredString(value: unknown, field: string, options: StringOptions = {}): string {
  if (isMissing(value) || (typeof value === 'string' && value.trim() === '')) {
    throw new BadRequestError(`${field} is required`);
  }
  return toCheckedString(value, field, options);
}

/** A string that may be left out, or sent as null. An empty string is kept. */
export function optionalString(value: unknown, field: string, options: StringOptions = {}): string | undefined {
  return isMissing(value) ? undefined : toCheckedString(value, field, options);
}

export interface NumberOptions {
  /** Exclusive: a quantity must be more than nothing. */
  greaterThan?: number,
  max?: number,
}

/** The most an INT column holds. */
export const INT_MAX = 2147483647;

/** A number, which may have a fraction. Numeric strings are accepted, as for integers. */
export function requiredNumber(value: unknown, field: string, options: NumberOptions = {}): number {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }

  let parsed = Number.NaN;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
    parsed = Number(value);
  }

  if (!Number.isFinite(parsed)) {
    throw new BadRequestError(`${field} must be a number`);
  }
  if (options.greaterThan !== undefined && parsed <= options.greaterThan) {
    throw new BadRequestError(`${field} must be greater than ${options.greaterThan}`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new BadRequestError(`${field} must be at most ${options.max}`);
  }

  return parsed;
}

/** A JSON array. Its entries are checked by the caller, which knows what they should be. */
export function requiredList(value: unknown, field: string): unknown[] {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  if (!Array.isArray(value)) {
    throw new BadRequestError(`${field} must be a list`);
  }
  return value;
}

/** A JSON object, such as an entry of a list, whose fields are then checked one by one. */
export function requiredObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

/** A date (2026-06-01), or an ISO 8601 timestamp with or without its offset (2026-06-01T17:00:00.000Z). */
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const BARE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A bare date is that day in the service's own time zone, where its dates are
 * written. `new Date('2026-07-01')` would be UTC midnight instead, which is the
 * evening before in America/New_York, and is filed under that day (L7).
 */
function parseDate(value: string): Date {
  const bare = BARE_DATE.exec(value);
  if (!bare) {
    return new Date(value);
  }

  const [ year, month, day, ] = bare.slice(1).map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);

  // Date rolls 2026-02-30 over into March; a day that doesn't exist isn't a date
  return date.getMonth() === month - 1 ? date : new Date(Number.NaN);
}

function toDate(value: unknown, field: string): Date {
  const date = typeof value === 'string' && DATE_FORMAT.test(value) ? parseDate(value) : undefined;

  if (date === undefined || Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${field} must be a date, as YYYY-MM-DD or an ISO 8601 timestamp`);
  }

  return date;
}

function requiredDate(value: unknown, field: string): Date {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  return toDate(value, field);
}

/**
 * A TIMESTAMP column holds 1970-01-01 00:00:01 to 2038-01-19 03:14:07 UTC. The
 * years at either end are left out, so that a date the server shifts into its
 * own time zone still fits.
 */
const TIMESTAMP_YEARS = { min: 1971, max: 2037, };

/** A date for a TIMESTAMP column. */
export function requiredTimestamp(value: unknown, field: string): Date {
  const date = requiredDate(value, field);
  const year = date.getUTCFullYear();

  if (year < TIMESTAMP_YEARS.min || year > TIMESTAMP_YEARS.max) {
    throw new BadRequestError(`${field} must be between ${TIMESTAMP_YEARS.min} and ${TIMESTAMP_YEARS.max}`);
  }

  return date;
}

/**
 * The JSON body's fields. Express 5 leaves req.body undefined when no body was
 * sent, so that reads as a body with no fields, and each required one is
 * reported missing.
 */
export function bodyOf(req: Request): Record<string, unknown> {
  const body: unknown = req.body;
  return typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
}
