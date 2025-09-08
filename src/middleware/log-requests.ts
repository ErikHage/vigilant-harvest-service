/* eslint-disable no-console */

import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (request: Request, response: Response, next: NextFunction) => {
  if (process.env.DEPLOYMENT_ENVIRONMENT === 'dev') {
    console.log('Request: ' + request.method + ': ' + request.baseUrl + request.path);
    console.log('  query:', request.query);
    console.log(' params:', request.params);
    console.log('   body:', request.body);
  }

  next();
};
