function fromError(err: Error): FeralError {
  const message = messageOf(err);

  if (err.cause) {
    return new FeralError(message, ensureError(err.cause));
  }
  return new FeralError(message);
}

/**
 * What went wrong, in words. Most errors say it in their message, but not all of them:
 * - an AggregateError's is often empty, and its inner errors say it;
 * - mysql2's promise API, failing to connect, throws an Error of its own with that empty message
 *   and only a code, such as ECONNREFUSED.
 */
function messageOf(err: Error): string {
  if (err instanceof AggregateError) {
    return aggregateMessage(err);
  }
  if (err.message !== '') {
    return err.message;
  }

  const code: unknown = (err as { code?: unknown }).code;

  return typeof code === 'string' && code !== '' ? `${err.name}: ${code}` : err.name;
}

/**
 * An AggregateError's own message, or its name when that's empty, then each inner error's message.
 * Node's net module throws one, with an empty message, when a host refuses on both IPv6 and IPv4.
 */
function aggregateMessage(err: AggregateError): string {
  const inner = (err.errors as unknown[]).map(each => ensureError(each).message).join('; ');

  return [ err.message || err.name, inner, ].filter(part => part !== '').join(': ');
}

export function ensureError(value: unknown): FeralError {
  if (value instanceof FeralError) {
    return value;
  }
  if (value instanceof Error) {
    return fromError(value);
  }

  let stringValue;
  try {
    stringValue = JSON.stringify(value);
  } catch {
    stringValue = '[Unable to stringify the thrown value]';
  }

  return new FeralError(`This value was thrown as is, not through an Error: ${stringValue}`);
}

/** What a client is told: no wrapped causes and no debug parameters. */
export interface FeralErrorResponse {
  name: string,
  message: string,
  status: number,
}

interface FeralErrorDetails {
  name: string,
  message: string,
  status: number,
  cause?: FeralErrorDetails,
  debugParams: object,
}

export class FeralError extends Error {
  status: number;
  debugParams: object;
  feralCause?: FeralError;

  constructor(message: string, cause?: FeralError) {
    super(message);
    this.name = 'FeralError';
    this.feralCause = cause;
    // a client error keeps its status through every layer that wraps it
    this.status = cause !== undefined && cause.status >= 400 && cause.status < 500 ? cause.status : 500;
    this.debugParams = {};
  }

  withDebugParams(debugParams: object): FeralError {
    this.debugParams = debugParams;
    return this;
  }

  /**
   * The error as a client sees it. A client error is described by the error
   * that set its status, the deepest one in the chain to carry it: that one
   * says why ("Planting has harvests"), where the wrappers above it only say
   * what was being done. A server error is described by the outermost one, so
   * nothing about its cause reaches the client.
   */
  toResponse(): FeralErrorResponse {
    const source = this.status >= 400 && this.status < 500 ? this.originOfStatus() : this;

    return {
      name: source.name,
      message: source.message,
      status: this.status,
    };
  }

  private originOfStatus(): FeralError {
    return this.feralCause !== undefined && this.feralCause.status === this.status
      ? this.feralCause.originOfStatus()
      : this;
  }

  /**
   * The whole chain, debug parameters included: for logs, never for responses.
   * It follows `feralCause`, and then a standard `cause` where that is all an
   * error has: MysqlError keeps the driver's own message ("Duplicate entry
   * ... for key ...") there.
   */
  toObject(): FeralErrorDetails {
    const next = this.feralCause ?? (this.cause instanceof FeralError ? this.cause : undefined);

    return {
      name: this.name,
      message: this.message,
      status: this.status,
      cause: next ? next.toObject() : undefined,
      debugParams: this.debugParams,
    };
  }
}
