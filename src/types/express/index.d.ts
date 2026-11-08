import { FeralToken } from '@feral-auth/token-verifier';

declare global {
  declare namespace Express {
    export interface Request {
      actor?: FeralToken
    }
  }
}
