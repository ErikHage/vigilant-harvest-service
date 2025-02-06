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
    this.status = 500;
    this.debugParams = {};
  }

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
