import path from 'path';
import dotenv from 'dotenv';

/**
 * Configuration for the acceptance suite.
 *
 * Everything here describes how to reach *running* services. Nothing in
 * test/acceptance may import from src/ -- the suite is a black-box client and
 * knows the service only through HTTP.
 */
export interface AcceptanceConfig {
  baseUrl: string,
  /** feral-authentication-service, where the suite logs in. */
  authUrl: string,
  username: string,
  password: string,
  applicationId: string,
  requestTimeoutMs: number,
}

const ENV_FILE_RELATIVE_PATH = 'test/acceptance/.env.acceptance';
const EXAMPLE_FILE_RELATIVE_PATH = 'test/acceptance/.env.acceptance.example';

const REQUIRED_KEYS = [
  'ACCEPTANCE_BASE_URL',
  'ACCEPTANCE_AUTH_URL',
  'ACCEPTANCE_USERNAME',
  'ACCEPTANCE_PASSWORD',
  'ACCEPTANCE_APPLICATION_ID',
] as const;

const URL_KEYS = [ 'ACCEPTANCE_BASE_URL', 'ACCEPTANCE_AUTH_URL', ] as const;

const LOCAL_HOSTS = [ 'localhost', '127.0.0.1', '[::1]', ];

const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

let cachedConfig: AcceptanceConfig | undefined;

export class AcceptanceConfigError extends Error {}

function envFilePath(): string {
  return path.resolve(process.cwd(), ENV_FILE_RELATIVE_PATH);
}

function readValue(key: string): string {
  return (process.env[key] ?? '').trim();
}

function isLocal(url: string): boolean {
  try {
    return LOCAL_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Reads and validates the environment. Values already in the shell win over
 * the file. Throws a message that names the problem and the fix.
 */
export function loadConfig(): AcceptanceConfig {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  dotenv.config({ path: envFilePath(), });

  const missing = REQUIRED_KEYS.filter(key => readValue(key) === '');

  if (missing.length > 0) {
    throw new AcceptanceConfigError(
      [
        'Acceptance test configuration is incomplete.',
        '',
        `Missing or blank: ${missing.join(', ')}`,
        '',
        `Create ${ENV_FILE_RELATIVE_PATH} by copying ${EXAMPLE_FILE_RELATIVE_PATH}`,
        'and filling in the blanks, or export the variables in your shell.',
      ].join('\n')
    );
  }

  // The suite writes and deletes data, so it must be unable to reach a live
  // service, whatever the configuration says.
  const notLocal = URL_KEYS.filter(key => !isLocal(readValue(key)));

  if (notLocal.length > 0) {
    throw new AcceptanceConfigError(
      [
        'The acceptance suite only runs against local services.',
        '',
        ...notLocal.map(key => `${key} is ${readValue(key)}`),
        '',
        `Point them at one of: ${LOCAL_HOSTS.join(', ')}`,
      ].join('\n')
    );
  }

  const timeout = Number(readValue('ACCEPTANCE_REQUEST_TIMEOUT_MS'));

  cachedConfig = {
    baseUrl: readValue('ACCEPTANCE_BASE_URL').replace(/\/+$/, ''),
    authUrl: readValue('ACCEPTANCE_AUTH_URL').replace(/\/+$/, ''),
    username: readValue('ACCEPTANCE_USERNAME'),
    password: readValue('ACCEPTANCE_PASSWORD'),
    applicationId: readValue('ACCEPTANCE_APPLICATION_ID'),
    requestTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_REQUEST_TIMEOUT_MS,
  };

  return cachedConfig;
}
