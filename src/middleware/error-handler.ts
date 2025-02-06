import { Request, Response, NextFunction } from 'express';

import { getLogger } from '../logging';
import { ensureError, FeralError } from '../errors';

const logger = getLogger('error-handler');

export default (
  err: Error,
  request: Request,
  response: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction) =>
{
  const error: FeralError = ensureError(err);

  if (process.env.DEPLOYMENT_ENVIRONMENT === 'dev') {
    logger.error(error, 'Error caught by middleware');
  }

  response.status(error.status).send({
    errors: [
      error.toObject(),
    ],
  });
};
