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
