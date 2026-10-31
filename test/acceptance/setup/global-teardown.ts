import { createHttpClient } from '../support/http-client';
import { loadConfig } from './config';
import { findResidue } from '../support/residue';

function failTheRun(message: string): void {
  process.stderr.write(`\n${message}\n\n`);
  process.exitCode = 1;
}

async function residueAfterTheRun(): Promise<string[]> {
  const config = loadConfig();
  const auth = createHttpClient({ baseUrl: config.authUrl, timeoutMs: config.requestTimeoutMs, });

  const { username, password, applicationId, } = config;
  const login = await auth.post('/login', { username, password, applicationId, });
  const token = (login.body as { token?: string } | undefined)?.token;

  const client = createHttpClient({ baseUrl: config.baseUrl, token, timeoutMs: config.requestTimeoutMs, });

  return findResidue(client);
}

/**
 * Runs once, after every spec: the suite's promise that it left nothing behind.
 *
 * Each spec's cleanup is best effort, so that a teardown problem cannot mask
 * the test's own failure. This is where a leftover becomes a failed run.
 *
 * It sets the exit code rather than throwing, because vitest reports an error
 * thrown here but still exits 0: a run that left data behind would pass. For
 * the same reason, a check that cannot be made fails the run too.
 *
 * The API cannot see the internal tables, but it does not have to: their
 * foreign keys tie every such row to a parent listed here.
 */
export async function globalTeardown(): Promise<void> {
  try {
    const residue = await residueAfterTheRun();

    if (residue.length > 0) {
      failTheRun(
        [
          `The suite left ${residue.length} test record(s) behind:`,
          ...residue.map(each => `  ${each}`),
          '',
          'The specs\' cleanup reported why on stderr. The README says how to clear them.',
        ].join('\n')
      );
    }
  } catch (err) {
    failTheRun(`Could not check for leftover test data: ${(err as Error).message}`);
  }
}
