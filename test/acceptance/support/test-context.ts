import { ANONYMOUS_ACTOR, Actor, MALFORMED_ACTOR } from './actors';
import { Drivers, createDrivers } from '../drivers/drivers';
import { forgedToken } from './forged-token';
import { createHttpClient, HttpClient } from './http-client';
import { TrackedResource } from './resources';
import { status } from './status-codes';
import { loadConfig } from '../setup/config';

/**
 * Per-spec context: how to reach the service, who the suite can act as, and
 * what this spec has created that needs cleaning up afterwards.
 *
 * Not used by a spec directly. `dsl/world.ts` wraps one of these, adding the
 * aliases a spec names its resources by, and a spec reaches both through
 * `cleanup()`.
 */
export interface TestContext {
  /**
   * The drivers, built once. They are stateless about identity -- each method
   * takes the caller as its first argument -- so one set serves every actor
   * this context hands out.
   */
  drivers: Drivers,
  /** The local-only test user. Logs in on first use, then reuses the token. */
  gardener(): Promise<Actor>,
  /** No auth token at all. */
  anonymous(): Actor,
  /** A well-formed token that was not signed by feral. */
  forged(): Actor,
  /** A token that is not a JWT at all. */
  malformed(): Actor,
  /**
   * The test user, in a session of its own that has been logged out of feral:
   * its token is signed and unexpired, but feral no longer accepts it.
   */
  loggedOut(): Promise<Actor>,
  cleanup(): Promise<void>,
}

export function createTestContext(): TestContext {
  const config = loadConfig();

  // Newest first, so a resource is removed before anything it was created
  // against.
  const created: TrackedResource[] = [];

  const registry = {
    register(resource: TrackedResource): void {
      created.unshift(resource);
    },
  };

  function clientFor(token: string | undefined): HttpClient {
    return createHttpClient({ baseUrl: config.baseUrl, token, timeoutMs: config.requestTimeoutMs, });
  }

  // Over tokenless clients: the drivers bind whichever caller they are given.
  const authClient = createHttpClient({ baseUrl: config.authUrl, timeoutMs: config.requestTimeoutMs, });
  const drivers = createDrivers(clientFor(undefined), authClient, registry);

  let gardenerToken: string | undefined;
  let forgedActor: Actor | undefined;

  async function gardener(): Promise<Actor> {
    if (gardenerToken === undefined) {
      gardenerToken = await drivers.authentication.loginReturnsToken(ANONYMOUS_ACTOR, {
        username: config.username,
        password: config.password,
        applicationId: config.applicationId,
      });
    }

    return { token: gardenerToken, username: config.username, };
  }

  function reportNotDeleted(resource: TrackedResource, problem: string): void {
    process.stderr.write(
      `cleanup could not delete ${resource.kind} ${resource.label} (${resource.path}): ${problem}\n`
    );
  }

  /** One pass. Returns what was rejected because something still depends on it. */
  async function deleteAll(client: HttpClient, resources: TrackedResource[]): Promise<TrackedResource[]> {
    const rejected: TrackedResource[] = [];

    for (const resource of resources) {
      try {
        const response = await client.del(resource.path);

        if (response.status === status.CONFLICT) {
          rejected.push(resource);
        } else if (response.status !== status.OK && response.status !== status.NO_CONTENT) {
          reportNotDeleted(resource, `${response.status} ${response.rawBody.slice(0, 300)}`);
        }
      } catch (err) {
        reportNotDeleted(resource, (err as Error).message);
      }
    }

    return rejected;
  }

  return {
    drivers,
    gardener,

    anonymous(): Actor {
      return ANONYMOUS_ACTOR;
    },

    forged(): Actor {
      forgedActor ??= { token: forgedToken(), username: 'forged', };

      return forgedActor;
    },

    malformed(): Actor {
      return MALFORMED_ACTOR;
    },

    // A session of its own: logging the shared gardener out would end it for every later test
    async loggedOut(): Promise<Actor> {
      const token = await drivers.authentication.loginReturnsToken(ANONYMOUS_ACTOR, {
        username: config.username,
        password: config.password,
        applicationId: config.applicationId,
      });
      const actor = { token, username: config.username, };

      await drivers.authentication.logoutSucceeds(actor);

      return actor;
    },

    /**
     * Deletes everything this spec created, newest first, over the API.
     *
     * Newest first isn't always dependency order: a plot created after the
     * planting put in it is rejected until that planting has gone. So what is
     * rejected is retried, for as long as each pass gets something deleted.
     *
     * It never throws, so that a teardown error cannot mask the failure the
     * test has already reported. What it could not delete goes to stderr, and
     * the global teardown fails the run over it.
     */
    async cleanup(): Promise<void> {
      let remaining = created.splice(0, created.length);

      if (remaining.length === 0) {
        return;
      }

      try {
        const client = clientFor((await gardener()).token);

        while (remaining.length > 0) {
          const rejected = await deleteAll(client, remaining);

          if (rejected.length === remaining.length) {
            rejected.forEach(resource => reportNotDeleted(resource, 'still rejected with 409'));
            return;
          }

          remaining = rejected;
        }
      } catch (err) {
        remaining.forEach(resource => reportNotDeleted(resource, (err as Error).message));
      }
    },
  };
}
