import { Request, Response, NextFunction } from 'express';

/**
 * Passes whatever a handler throws to the error handler, which logs it. It
 * doesn't log here, so that each failed request is logged once.
 */
/* eslint-disable-next-line @typescript-eslint/ban-types */
function decorate(middlewareFunction: Function) {
  return async function (request: Request, response: Response, next: NextFunction) {
    try {
      await middlewareFunction(request, response, next);
    } catch (err) {
      next(err);
    }
  }
}

export default {
  decorate,
}
