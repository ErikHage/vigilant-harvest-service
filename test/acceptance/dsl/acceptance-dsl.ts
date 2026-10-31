import { ActivityLogDsl, createActivityLogDsl } from './activity-log-dsl';
import { ActivitySchedulesDsl, createActivitySchedulesDsl } from './activity-schedules-dsl';
import { AuthenticationDsl, createAuthenticationDsl } from './authentication-dsl';
import { HarvestTypesDsl, createHarvestTypesDsl } from './harvest-types-dsl';
import { HarvestsDsl, createHarvestsDsl } from './harvests-dsl';
import { JournalDsl, createJournalDsl } from './journal-dsl';
import { PlanningDsl, createPlanningDsl } from './planning-dsl';
import { PlantCategoriesDsl, createPlantCategoriesDsl } from './plant-categories-dsl';
import { PlantingYearsDsl, createPlantingYearsDsl } from './planting-years-dsl';
import { PlantingsDsl, createPlantingsDsl } from './plantings-dsl';
import { PlantsDsl, createPlantsDsl } from './plants-dsl';
import { PlotsDsl, createPlotsDsl } from './plots-dsl';
import { ServiceInfoDsl, createServiceInfoDsl } from './service-info-dsl';
import { createWorld } from './world';

/**
 * The one thing a spec imports.
 *
 * Everything a spec can say lives behind this: the per-grouping DSL modules,
 * and the cleanup that forgets the names they handed out. Keeping it to a
 * single entry point is what makes the layering checkable -- any other import
 * in specs/ is a spec reaching past the DSL.
 *
 * Create one per spec file. The modules share a world, so a plant named in one
 * of them is the same plant in all of them.
 */
export interface AcceptanceDsl {
  serviceInfo: ServiceInfoDsl,
  auth: AuthenticationDsl,
  plantCategories: PlantCategoriesDsl,
  plants: PlantsDsl,
  plots: PlotsDsl,
  plantingYears: PlantingYearsDsl,
  plantings: PlantingsDsl,
  planning: PlanningDsl,
  harvests: HarvestsDsl,
  harvestTypes: HarvestTypesDsl,
  journal: JournalDsl,
  activityLog: ActivityLogDsl,
  activitySchedules: ActivitySchedulesDsl,
  /** Tears down what the spec created and forgets every name. */
  cleanup(): Promise<void>,
}

export function createAcceptanceDsl(): AcceptanceDsl {
  const world = createWorld();
  const { drivers, } = world;

  return {
    serviceInfo: createServiceInfoDsl(world, drivers.serviceInfo),
    auth: createAuthenticationDsl(world, drivers.authentication),
    plantCategories: createPlantCategoriesDsl(world, drivers.plantCategories),
    plants: createPlantsDsl(world, drivers.plants),
    plots: createPlotsDsl(world, drivers.plots),
    plantingYears: createPlantingYearsDsl(world, drivers.plantingYears),
    plantings: createPlantingsDsl(world, drivers.plantings),
    planning: createPlanningDsl(world, drivers.planning),
    harvests: createHarvestsDsl(world, drivers.harvests),
    harvestTypes: createHarvestTypesDsl(world, drivers.harvestTypes),
    journal: createJournalDsl(world, drivers.journal),
    activityLog: createActivityLogDsl(world, drivers.activityLog),
    activitySchedules: createActivitySchedulesDsl(world, drivers.activitySchedules),
    cleanup: (): Promise<void> => world.cleanup(),
  };
}
