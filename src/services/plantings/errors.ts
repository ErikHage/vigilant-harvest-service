import { FeralError } from '../../errors';

export class LifecycleTransitionViolationError extends FeralError {
  constructor(currentStatus: string, attempted: string) {
    super(`Lifecycle transition from ${currentStatus} to ${attempted} not allowed.`);
    this.status = 400;
  }
}

export class PlantingValidationError extends FeralError {
  constructor(message: string) {
    super(message);
    this.status = 400;
  }
}
