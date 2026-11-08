import { AUTH_HEADER, createHttpClient, ServiceUnreachableError } from '../support/http-client';
import { AcceptanceConfig, AcceptanceConfigError, loadConfig } from './config';
import { findResidue } from '../support/residue';
import { globalTeardown } from './global-teardown';
import { status } from '../support/status-codes';

/**
 * Runs once, before any spec.
 *
 * Its whole job is to turn each way this suite can be misconfigured into one
 * message that names the fix, rather than a wall of identical failures.
 *
 * Returns the teardown, so that it only runs when the preflight passed: after
 * a failed preflight it would just fail again, and bury the message that
 * matters.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  try {
    return await runPreflight();
  } catch (err) {
    // vitest 5.0 can fail while printing an error thrown from here: vite's
    // source-map lookup throws a TypeError, and the run ends with "No test
    // files found" and no message. So the message is written here as well.
    process.stderr.write(`\n${err instanceof Error ? err.message : String(err)}\n\n`);
    throw err;
  }
}

async function runPreflight(): Promise<() => Promise<void>> {
  const config = loadConfigOrExplain();

  await assertServiceIsUp(config);

  const token = await logIn(config);
  const client = createHttpClient({ baseUrl: config.baseUrl, token, timeoutMs: config.requestTimeoutMs, });

  // 3. Does the service accept feral's token, and is its database migrated?
  //    Harvest types need a token and a migrated database, and are seeded.
  const probe = await client.get('/harvest-types');

  if (probe.status === status.UNAUTHORIZED) {
    throw new Error(
      [
        'The service rejected a token feral-authentication-service just issued.',
        '',
        'The service\'s FERAL_APPLICATION_ID (in .env) is not',
        `${config.applicationId}, the application the suite logs in to.`,
        '',
        `The token is sent as the "${AUTH_HEADER}" header.`,
      ].join('\n')
    );
  }

  if (probe.status === status.SERVICE_UNAVAILABLE) {
    throw new Error(
      [
        'The service could not get its public keys from feral-authentication-service.',
        '',
        'Check the service\'s FERAL_AUTH_URL and FERAL_APPLICATION_ID (in .env): feral',
        'must be reachable there, be new enough to serve',
        '/applications/:applicationId/public-keys, and know the application by that id.',
        'The service\'s log says which.',
      ].join('\n')
    );
  }

  if (probe.status !== status.OK || !Array.isArray(probe.body) || probe.body.length === 0) {
    throw new Error(
      [
        `Preflight call to GET /harvest-types returned ${probe.status}, expected a seeded list.`,
        'Are the migrations up to date? They run when the service starts.',
        `Response body: ${probe.rawBody}`,
      ].join('\n')
    );
  }

  // 4. Would this run fail at the end for something an earlier run left?
  const residue = await findResidue(client);

  if (residue.length > 0) {
    process.stderr.write(
      `\nWarning: ${residue.length} test record(s) left by an earlier run. ` +
      'This run will fail its residue check until they are gone; the README says how.\n' +
      `${residue.map(each => `  ${each}`).join('\n')}\n\n`
    );
  }

  return globalTeardown;
}

function loadConfigOrExplain(): AcceptanceConfig {
  try {
    return loadConfig();
  } catch (err) {
    if (err instanceof AcceptanceConfigError) {
      throw new Error(err.message);
    }
    throw err;
  }
}

// 1. Is anything listening, and is it this service?
async function assertServiceIsUp(config: AcceptanceConfig): Promise<void> {
  const client = createHttpClient({ baseUrl: config.baseUrl, timeoutMs: config.requestTimeoutMs, });

  try {
    await client.get('/service-info');
  } catch (err) {
    if (err instanceof ServiceUnreachableError) {
      // The client's message already names the url and the fix.
      throw new Error(`Preflight failed.\n\n${err.message}`);
    }
    throw err;
  }
}

// 2. Is feral up, and can the test user log in to this application?
async function logIn(config: AcceptanceConfig): Promise<string> {
  const client = createHttpClient({ baseUrl: config.authUrl, timeoutMs: config.requestTimeoutMs, });
  const { username, password, applicationId, } = config;

  try {
    const login = await client.post('/login', { username, password, applicationId, });
    const token = (login.body as { token?: string } | undefined)?.token;

    if (login.status !== status.OK || token === undefined || token === '') {
      throw new Error(
        [
          `Could not log in as "${username}" (got ${login.status}).`,
          '',
          'Check ACCEPTANCE_USERNAME, ACCEPTANCE_PASSWORD and ACCEPTANCE_APPLICATION_ID.',
          'A 403 means the user has no grant to that application; the README says how',
          'to create the user and grant it.',
        ].join('\n')
      );
    }

    return token;
  } catch (err) {
    if (err instanceof ServiceUnreachableError) {
      throw new Error(`Preflight failed.\n\n${err.message}`);
    }
    throw err;
  }
}
