import { ActivityLogDriver, createActivityLogDriver } from './activity-log-driver';
import { ActivitySchedulesDriver, createActivitySchedulesDriver } from './activity-schedules-driver';
import { AuthenticationDriver, createAuthenticationDriver } from './authentication-driver';
import { HarvestTypesDriver, createHarvestTypesDriver } from './harvest-types-driver';
import { HarvestsDriver, createHarvestsDriver } from './harvests-driver';
import { HttpClient } from '../support/http-client';
import { JournalDriver, createJournalDriver } from './journal-driver';
import { PlanningDriver, createPlanningDriver } from './planning-driver';
import { PlantCategoriesDriver, createPlantCategoriesDriver } from './plant-categories-driver';
import { PlantingYearsDriver, createPlantingYearsDriver } from './planting-years-driver';
import { PlantingsDriver, createPlantingsDriver } from './plantings-driver';
import { PlantsDriver, createPlantsDriver } from './plants-driver';
import { PlotsDriver, createPlotsDriver } from './plots-driver';
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
  plants: PlantsDriver,
  plots: PlotsDriver,
  plantingYears: PlantingYearsDriver,
  plantings: PlantingsDriver,
  planning: PlanningDriver,
  harvests: HarvestsDriver,
  harvestTypes: HarvestTypesDriver,
  journal: JournalDriver,
  activityLog: ActivityLogDriver,
  activitySchedules: ActivitySchedulesDriver,
}

export function createDrivers(client: HttpClient, authClient: HttpClient, registry: ResourceRegistry): Drivers {
  return {
    serviceInfo: createServiceInfoDriver(client),
    authentication: createAuthenticationDriver(client, authClient),
    plantCategories: createPlantCategoriesDriver(client, registry),
    plants: createPlantsDriver(client, registry),
    plots: createPlotsDriver(client, registry),
    plantingYears: createPlantingYearsDriver(client, registry),
    plantings: createPlantingsDriver(client, registry),
    planning: createPlanningDriver(client),
    harvests: createHarvestsDriver(client, registry),
    harvestTypes: createHarvestTypesDriver(client),
    journal: createJournalDriver(client, registry),
    activityLog: createActivityLogDriver(client, registry),
    activitySchedules: createActivitySchedulesDriver(client, registry),
  };
}
