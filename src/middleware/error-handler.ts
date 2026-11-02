import { Request, Response, NextFunction } from 'express';

import { getLogger } from '../logging';
import { ensureError, FeralError } from '../errors';
import { RequestError } from '../errors/common';

const logger = getLogger('error-handler');

/**
 * Express's body parsers raise errors that carry their own 4xx status and mark
 * themselves as safe to show (`expose`). ensureError would make them 500s.
 */
function toFeralError(err: unknown): FeralError {
  const { status, expose, type, } = (err ?? {}) as { status?: unknown, expose?: unknown, type?: unknown };

  if (!(err instanceof FeralError) && expose === true && typeof status === 'number' && status >= 400 && status < 500) {
    const message = type === 'entity.parse.failed' ? 'Request body is not valid JSON' : (err as Error).message;
    return new RequestError(message, status);
  }

  return ensureError(err);
}

/**
 * Mounted twice: on the API router, and on the app after it, for errors raised
 * before the router runs (the body parsers in app.ts).
 */
export default (
  err: Error,
  request: Request,
  response: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction) =>
{
  const error: FeralError = toFeralError(err);

  if (process.env.DEPLOYMENT_ENVIRONMENT === 'dev') {
    logger.error(error, 'Error caught by middleware');
  }

  response.status(error.status).send({
    errors: [
      error.toResponse(),
    ],
  });
};
