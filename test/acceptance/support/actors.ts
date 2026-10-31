/**
 * An identity making calls against the service: the token a call is made with,
 * and the name it was minted for.
 *
 * Nothing hangs off an actor. The drivers are built once, over a tokenless
 * client, and every driver method takes the caller as its first argument -- so
 * an actor is a value the DSL passes downwards, not an object that knows how
 * to reach the API. That is what leaves `dsl/` with no way to make an HTTP
 * call of its own.
 *
 * Specs do not see actors at all. They name a caller with `as:` and the DSL
 * resolves it through `world.actorFor`.
 */
export interface Actor {
  /** The token this actor presents, or undefined when anonymous. */
  readonly token: string | undefined,
  /** Who this actor claims to be, or undefined when anonymous. */
  readonly username: string | undefined,
}

/** No token at all. */
export const ANONYMOUS_ACTOR: Actor = { token: undefined, username: undefined, };

/** A token that is not a JWT at all. */
export const MALFORMED_ACTOR: Actor = { token: 'not-a-jwt', username: 'malformed', };
