import { Actor } from './service/sessions/types';

declare global {
  declare namespace Express {
    export interface Request {
      actor?: Actor
    }
  }
}
