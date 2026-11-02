function fromError(err: Error): FeralError {
  if (err.cause) {
    return new FeralError(err.message, ensureError(err.cause));
  }
  return new FeralError(err.message);
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

  /** The whole chain, debug parameters included: for logs, never for responses. */
  toObject(): FeralErrorDetails {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      cause: this.feralCause ? this.feralCause.toObject() : undefined,
      debugParams: this.debugParams,
    };
  }
}
