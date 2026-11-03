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
