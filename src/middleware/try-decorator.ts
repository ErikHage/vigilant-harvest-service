import { Request, Response, NextFunction } from 'express';

import { getLogger } from '../logging';
import { ensureError } from '../errors';

const logger = getLogger('error-handler');

/* eslint-disable-next-line @typescript-eslint/ban-types */
function decorate(middlewareFunction: Function) {
  return async function (request: Request, response: Response, next: NextFunction) {
    try {
      await middlewareFunction(request, response, next);
    } catch (err) {
      if (process.env.DEPLOYMENT_ENVIRONMENT === 'dev') {
        const error = ensureError(err);
        logger.error(error, 'A handler threw an error');
      }
      next(err);
    }
  }
}

export default {
  decorate,
}
