import { describe, expect, it } from 'vitest';

import { ensureError, FeralError } from '../../../src/errors';

describe('ensureError', () => {
  it('keeps a FeralError as it is', () => {
    const error = new FeralError('already one');

    expect(ensureError(error)).toBe(error);
  });

  it('keeps an Error\'s message', () => {
    expect(ensureError(new Error('went wrong')).message).toBe('went wrong');
  });

  // mysql2 throws one when it can't connect over IPv6 or IPv4, with an empty message of its own
  it('keeps an AggregateError\'s inner messages, when its own is empty', () => {
    const aggregate = new AggregateError([
      new Error('connect ECONNREFUSED ::1:3306'),
      new Error('connect ECONNREFUSED 127.0.0.1:3306'),
    ], '');

    expect(ensureError(aggregate).message)
      .toBe('AggregateError: connect ECONNREFUSED ::1:3306; connect ECONNREFUSED 127.0.0.1:3306');
  });

  it('keeps an AggregateError\'s own message before its inner ones', () => {
    const aggregate = new AggregateError([ new Error('the first'), 'a thrown string', ], 'Both failed');

    expect(ensureError(aggregate).message)
      .toBe('Both failed: the first; This value was thrown as is, not through an Error: "a thrown string"');
  });

  // What mysql2's promise API actually throws when it can't connect: it copies the AggregateError's
  // empty message and its code onto an Error of its own, and drops the inner errors
  it('names an Error by its code, when its message is empty', () => {
    const refused = Object.assign(new Error(''), { code: 'ECONNREFUSED', });

    expect(ensureError(refused).message).toBe('Error: ECONNREFUSED');
  });

  it('names an Error by its name alone, when it has no message and no code', () => {
    expect(ensureError(new TypeError('')).message).toBe('TypeError');
  });

  it('describes a value thrown that is not an Error', () => {
    expect(ensureError({ code: 42, }).message)
      .toBe('This value was thrown as is, not through an Error: {"code":42}');
  });
});
