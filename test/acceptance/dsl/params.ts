import { ParamDefinition, required } from '@feral-auth/ts-simple-dsl';

/**
 * Parameter declarations shared across the DSL modules, so that every module
 * asks the same question with the same word.
 */

/** The name a spec gives a resource, to refer to it in a later step. */
export function alias(): ParamDefinition<string, false, false> {
  return required();
}

/**
 * Who makes the call. Required, and deliberately so: a defaulted caller means
 * a test can be read without noticing what it depends on.
 *
 * Deliberately not `allowedValues`, so that `actorFor` can answer an unknown
 * name with the names that *are* available.
 */
export function actor(): ParamDefinition<string, false, false> {
  return required();
}

/** What a step should do, e.g. `expect: accepted | is rejected`. */
export function outcome<const TValues extends readonly string[]>(
  ...values: TValues
): ParamDefinition<TValues[number], false, false> {
  return required().allowedValues(...values);
}
