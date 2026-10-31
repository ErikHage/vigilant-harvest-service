import { Actor } from '../support/actors';
import { expectListEntries, expectStatus, expectThat } from './assertions';
import { HttpClient } from '../support/http-client';
import { status } from '../support/status-codes';

export interface HarvestTypesDriver {
  /** Harvest types are seeded, so a spec names one and this finds its id. */
  idOfTypeNamed(caller: Actor, harvestTypeName: string): Promise<number>,
  listIncludes(caller: Actor, harvestTypeName: string): Promise<void>,
}

export function createHarvestTypesDriver(client: HttpClient): HarvestTypesDriver {
  async function find(caller: Actor, harvestTypeName: string, what: string) {
    const response = await client.withToken(caller.token).get('/harvest-types');

    expectStatus(response, status.OK, what);

    const entry = expectListEntries(response, what).find(each => each.harvestTypeName === harvestTypeName);

    expectThat(entry !== undefined, `a harvest type named ${harvestTypeName}`, response, what);

    return entry!;
  }

  return {
    async idOfTypeNamed(caller: Actor, harvestTypeName: string): Promise<number> {
      const entry = await find(caller, harvestTypeName, `finding harvest type ${harvestTypeName}`);

      return entry.harvestTypeId as number;
    },

    async listIncludes(caller: Actor, harvestTypeName: string): Promise<void> {
      await find(caller, harvestTypeName, `finding harvest type ${harvestTypeName} in the list`);
    },
  };
}
