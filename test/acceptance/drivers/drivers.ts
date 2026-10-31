import { AuthenticationDriver, createAuthenticationDriver } from './authentication-driver';
import { HttpClient } from '../support/http-client';
import { PlantCategoriesDriver, createPlantCategoriesDriver } from './plant-categories-driver';
import { ResourceRegistry } from '../support/resources';
import { ServiceInfoDriver, createServiceInfoDriver } from './service-info-driver';

/**
 * One driver per API grouping, built once for the whole spec.
 *
 * A driver describes endpoints, not identities: its status codes and field
 * paths are the same whoever calls them, so there is no reason to build a set
 * per session. The caller arrives as the first argument to each method
 * instead, and the driver binds its token there.
 *
 * Both clients are tokenless. `authClient` reaches feral-authentication-service,
 * and only logging in needs it.
 */
export interface Drivers {
  serviceInfo: ServiceInfoDriver,
  authentication: AuthenticationDriver,
  plantCategories: PlantCategoriesDriver,
}

export function createDrivers(client: HttpClient, authClient: HttpClient, registry: ResourceRegistry): Drivers {
  return {
    serviceInfo: createServiceInfoDriver(client),
    authentication: createAuthenticationDriver(client, authClient),
    plantCategories: createPlantCategoriesDriver(client, registry),
  };
}
