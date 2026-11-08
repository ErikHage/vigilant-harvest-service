/**
 * HTTP status codes the drivers expect from the service.
 *
 * Deliberately a copy rather than an import of src/util/http-status.ts: the
 * acceptance suite is a black-box client and must not depend on the code it
 * is testing. If the service ever changed a code, importing the constant
 * would make the test agree with the change instead of catching it.
 */
export const status = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
