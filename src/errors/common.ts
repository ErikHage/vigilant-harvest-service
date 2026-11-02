import { FeralError } from './index';

export class BadRequestError extends FeralError {
  constructor(message: string) {
    super(message);
    this.status = 400;
  }
}

export class UnauthorizedError extends FeralError {
  constructor() {
    super('Unauthorized');
    this.status = 401;
  }
}

export class ConflictError extends FeralError {
  constructor(message: string) {
    super(message);
    this.status = 409;
  }
}

/**
 * A client error raised before the service's own code runs, by a body parser,
 * which knows its status (400 for malformed JSON, 413 for a body too large).
 */
export class RequestError extends FeralError {
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends FeralError {
  constructor(message: string) {
    super(message);
    this.status = 400;
  }
}
