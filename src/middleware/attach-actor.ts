import { createVerifier, TokenVerificationError } from '@feral-auth/token-verifier';
import { AuthMiddleware, createAuthMiddleware } from '@feral-auth/token-verifier/express';

import { ServiceUnavailableError, UnauthorizedError } from '../errors/common';

import { ensureError, FeralError } from '../errors';
import environment from '../util/environment';

// The error handler logs the token's error, with its reason, as the cause
function toFeralError(error: TokenVerificationError): FeralError {
  // Feral couldn't be asked for its keys: the token may well be good
  if (error.reason === 'unavailable') {
    return new ServiceUnavailableError(ensureError(error));
  }

  return new UnauthorizedError(ensureError(error));
}

/**
 * Verifies the x-feral-auth-token header and sets the token on `request.actor`.
 *
 * Build it once, after server.ts has loaded .env. The verifier caches feral's
 * public keys for this application, and every request shares it.
 */
export default function attachActor(): AuthMiddleware {
  return createAuthMiddleware({
    verifier: createVerifier({
      applicationId: environment.getEnvVar('FERAL_APPLICATION_ID'),
      authServiceUrl: environment.getEnvVar('FERAL_AUTH_URL'),
    }),
    mapError: toFeralError,
  });
}
