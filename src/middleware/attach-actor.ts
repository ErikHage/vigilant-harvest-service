import { NextFunction, Request, Response } from 'express';

import { BadRequestError, UnauthorizedError } from '../errors/common';

import { getLogger } from '../logging';
import { ensureError, FeralError } from '../errors';
import { JwtSigner, JwtVerifyError } from '../jwt';
import environment from '../util/environment';
import { Actor } from '../jwt/types';

const logger = getLogger('attach-actor-middleware');

const signer: JwtSigner = new JwtSigner(
  () => '', // don't need this
  environment.envVarLoader('SESSION_PUBLIC_CERT'),
  {
    verifyOptions: {
      algorithms: [ 'RS256', ],
      issuer: 'feral-auth',
    },
  }
);

async function verifySessionToken(token: string): Promise<Actor> {
  try {
    return signer.verify<Actor>(token);
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error parsing session token');
    throw error;
  }
}

export default async function(request: Request, response: Response, next: NextFunction) {
  const feralAuthToken = request.headers['x-feral-auth-token'];

  if (!feralAuthToken) {
    next(new UnauthorizedError());
  }

  if (typeof feralAuthToken !== 'string') {
    next(new BadRequestError('auth token must be a single string'));
  }

  try {
    request.actor = await verifySessionToken(feralAuthToken as string);
    next();
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Failed to attach actor');
    if (error instanceof JwtVerifyError) {
      next(new UnauthorizedError());
    } else {
      next(new FeralError('Unknown error authenticating token'));
    }
  }
}
