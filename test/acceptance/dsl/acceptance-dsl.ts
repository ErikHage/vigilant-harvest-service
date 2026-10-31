import { AuthenticationDsl, createAuthenticationDsl } from './authentication-dsl';
import { PlantCategoriesDsl, createPlantCategoriesDsl } from './plant-categories-dsl';
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
 * Create one per spec file. The modules share a world, so a category named in
 * one of them is the same category in all of them.
 */
export interface AcceptanceDsl {
  serviceInfo: ServiceInfoDsl,
  auth: AuthenticationDsl,
  plantCategories: PlantCategoriesDsl,
  /** Tears down what the spec created and forgets every name. */
  cleanup(): Promise<void>,
}

export function createAcceptanceDsl(): AcceptanceDsl {
  const world = createWorld();
  const { serviceInfo, authentication, plantCategories, } = world.drivers;

  return {
    serviceInfo: createServiceInfoDsl(world, serviceInfo),
    auth: createAuthenticationDsl(world, authentication),
    plantCategories: createPlantCategoriesDsl(world, plantCategories),
    cleanup: (): Promise<void> => world.cleanup(),
  };
}
