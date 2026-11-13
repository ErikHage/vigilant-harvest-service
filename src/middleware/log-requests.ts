import { Request, Response, NextFunction } from 'express';

import { getLogger } from '../logging';

const logger = getLogger('log-requests');

/** In dev, each request and what it carries. Never live: a body can hold anything the user typed. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (request: Request, response: Response, next: NextFunction) => {
  if (process.env.DEPLOYMENT_ENVIRONMENT === 'dev') {
    logger.info(
      { query: request.query, params: request.params, body: request.body, },
      `Request: ${request.method} ${request.baseUrl}${request.path}`
    );
  }

  next();
};
