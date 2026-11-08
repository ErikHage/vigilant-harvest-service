import { NextFunction, Request, Response } from 'express';
import { createVerifier, TokenVerificationError, Verifier } from '@feral-auth/token-verifier';

import { BadRequestError, ServiceUnavailableError, UnauthorizedError } from '../errors/common';

import { ensureError, FeralError } from '../errors';
import environment from '../util/environment';

let verifier: Verifier | undefined;

// Built on the first request rather than at import, which runs before
// server.ts has loaded .env. It caches feral's public keys for this
// application, so it is built once and shared.
function feralVerifier(): Verifier {
  verifier ??= createVerifier({
    applicationId: environment.getEnvVar('FERAL_APPLICATION_ID'),
    authServiceUrl: environment.getEnvVar('FERAL_AUTH_URL'),
  });

  return verifier;
}

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
    request.actor = await feralVerifier().verify(feralAuthToken);
    next();
  } catch (err) {
    // the error handler logs it, with the reason as the cause
    const error = ensureError(err);
    if (!(err instanceof TokenVerificationError)) {
      next(new FeralError('Unknown error authenticating token', error));
    } else if (err.reason === 'unavailable') {
      // Feral couldn't be asked for its keys: the token may well be good
      next(new ServiceUnavailableError(error));
    } else {
      next(new UnauthorizedError(error));
    }
  }
}
