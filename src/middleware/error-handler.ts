import { Request, Response, NextFunction } from 'express';

import { getLogger } from '../logging';
import { ensureError } from '../errors';

const logger = getLogger('error-handler');

export default (
  err: Error,
  request: Request,
  response: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction) =>
{
  const error = ensureError(err);

  if (process.env.DEPLOYMENT_ENVIRONMENT === 'dev') {
    logger.error(error, 'Error caught by middleware');
  }

  // todo replace with a toJson(FeralError) method
  response.status(error.status).send({
    errors: [
      {
        message: 'Something went wrong!',
      },
    ],
  });
};
