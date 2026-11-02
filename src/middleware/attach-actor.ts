import { NextFunction, Request, Response } from 'express';

import { BadRequestError, UnauthorizedError } from '../errors/common';

import { ensureError, FeralError } from '../errors';
import { JwtSigner, JwtVerifyError } from '../jwt';
import environment from '../util/environment';
import { Actor } from '../jwt/types';

const signer: JwtSigner = new JwtSigner(
  () => '', // don't need this
  environment.envVarLoader('SESSION_PUBLIC_KEY'),
  {
    verifyOptions: {
      algorithms: [ 'RS256', ],
      issuer: 'feral-auth',
    },
  }
);

export default async function(request: Request, response: Response, next: NextFunction) {
  const feralAuthToken = request.headers['x-feral-auth-token'];

  if (!feralAuthToken) {
    next(new UnauthorizedError());
    return;
  }

  if (typeof feralAuthToken !== 'string') {
    next(new BadRequestError('auth token must be a single string'));
    return;
  }

  try {
    request.actor = await signer.verify<Actor>(feralAuthToken);
    next();
  } catch (err) {
    // the error handler logs it, with the reason as the cause
    const error = ensureError(err);
    if (error instanceof JwtVerifyError) {
      next(new UnauthorizedError(error));
    } else {
      next(new FeralError('Unknown error authenticating token', error));
    }
  }
}
