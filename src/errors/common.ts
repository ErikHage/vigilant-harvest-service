import { FeralError } from './index';

export class BadRequestError extends FeralError {
  constructor(message: string) {
    super(message);
    this.status = 400;
  }
}
