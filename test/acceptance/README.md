# Acceptance tests

Black-box tests that drive a **running** instance of the service over HTTP, and remove every row
they create.

## Rules

1. **Local services only.** Tests call services listening on real ports. They never start one, and
   the config rejects any host but this machine, because the suite writes and deletes data.
2. **No direct calls into the code.** Nothing here imports from `src/`. Status codes are re-declared
   in `support/status-codes.ts`, so changing a code in the service breaks a test instead of
   silently agreeing with it.
3. **Assertions live in the drivers.** Neither a spec nor a DSL module contains an `expect`, a
   status code or a JSON field path. Wanting one means a named driver method is missing.
4. **Specs are prose.** A spec passes `"name: value"` strings and nothing else. Its only import is
   `dsl/acceptance-dsl.ts`, plus the runner, and `dsl/dsl-misuse.ts` in the misuse spec.

## Running them

```sh
# once, per checkout
cp test/acceptance/.env.acceptance.example test/acceptance/.env.acceptance
# then fill in the password and application id; see "Getting a token"

# every time, with feral-authentication-service and this service running
../start-vigilant-harvest.sh     # or `npm run dev` in each repo
npm run test:acceptance
```

`npm run test:acceptance:watch` reruns on change, and `npm run tsc:acceptance` type-checks the suite.

A preflight probes everything first, and turns each way the suite can be misconfigured into one
message that names the fix. The message comes first. vitest 5.0 then adds "No test files found" and
a `TypeError` from printing the same error; ignore those.

## How it hangs together

Two layers per API grouping, with shared plumbing underneath.

```
specs/*.spec.ts        what the service should do, in words
   |                   "name: value" strings, and nothing else
   v
dsl/*-dsl.ts           parses the prose into typed params, resolves the names a spec used
   |                   and the caller, then hands both to the driver it holds
   v
drivers/*-driver.ts    the caller first, then typed args; every assertion, status code and
   |                   field path, and where the token is bound
   v
drivers/assertions.ts  shared expectations; the only importer of vitest's expect
   v
support/http-client.ts the only place fetch() is called; never throws on non-2xx
```

## Names and callers

- `dsl/world.ts` holds what a spec has named, because a name given in one module is used in another.
- A spec's `category: herbs` is an alias. The real name gets a prefix and a random suffix
  (`acc-herbs-3f9a1c`), because the database is never reset and most names are unique keys.
- `as:` is required and comes first. There is no default, because the caller is part of what a step
  depends on. The reserved callers are `gardener`, `anonymous`, `forged` and `malformed`.
- **Planting years are integers**, and real years must never be touched, so test years come from
  **9000–9999**. Harvest, journal and activity-log *dates* are unrelated: the service never ties
  them to the planting year, so use real dates. They are the user's own wall-clock values, sent
  and returned with no time zone: `YYYY-MM-DD` for a harvest, `YYYY-MM-DDTHH:mm:ss` for an entry.
- Every 409 driver asserts the reason as well as the status. The foreign keys answer 409 by
  themselves, so the status alone can't show that the service's own check ran.

## Getting a token

The suite gets its token the way the app does, by logging in to feral-authentication-service.
`vigilant-test-gardener` exists only in local databases, so a run pointed at a live service fails
at login. Never log in here as a real user.

To create it, through feral's API, as a feral admin (locally, `feral-test-admin`):

1. `POST /users` with `username`, `firstName`, `lastName`, `email` and a generated `password`.
2. `GET /applications`, and find the application whose scope is `vigilant`.
3. `POST /users/:userId/applications` with `{ "applicationIds": [ "<that id>" ] }`. Without this
   grant, login is rejected with a 403.

The password and application id go in `.env.acceptance`, which is gitignored.

## Cleanup

Three things make sure a run removes what it created:

1. **Each spec's `afterEach(cleanup)`** deletes what the spec registered, newest first, and retries
   what was rejected with a 409, for as long as each pass gets something deleted. It never throws,
   so it can't mask a test's own failure. What it can't delete goes to stderr.
2. **The residue check** runs after the last spec. It lists `acc-` plants, plots, plantings,
   categories, subcategories and schedules, and years in 9000–9999 with their journal and log
   entries. If it finds anything, **it fails the run**, even when every test passed.
3. **The foreign keys** tie every row the API can't list (status history, year mappings, schedule
   links, harvests) to a parent the check does list. The report at the top of
   `scripts/foreign-key-orphans.sql` confirms it by hand: every count should be 0.

If a run leaves something behind, the failure names it. To clear it by hand, children first:

```sql
SET SQL_SAFE_UPDATES = 0;
START TRANSACTION;

DELETE h FROM harvests h JOIN plantings p ON p.planting_id = h.planting_id
 WHERE p.planting_name LIKE 'acc-%' OR p.current_planting_year BETWEEN 9000 AND 9999;
DELETE FROM plantings WHERE planting_name LIKE 'acc-%' OR current_planting_year BETWEEN 9000 AND 9999;
DELETE FROM garden_journal WHERE planting_year BETWEEN 9000 AND 9999;
DELETE FROM garden_activity_log WHERE planting_year BETWEEN 9000 AND 9999;
DELETE FROM planting_years WHERE planting_year BETWEEN 9000 AND 9999;
DELETE FROM plants WHERE friendly_name LIKE 'acc-%';
DELETE FROM plots WHERE friendly_name LIKE 'acc-%';
DELETE FROM activity_schedules WHERE name LIKE 'acc-%';
DELETE FROM plant_subcategories WHERE subcategory_name LIKE 'acc-%';
DELETE FROM plant_categories WHERE category_name LIKE 'acc-%';

-- check what's left, then COMMIT, or ROLLBACK if anything looks wrong
COMMIT;
SET SQL_SAFE_UPDATES = 1;
```

## Known-broken behaviour

A test for something the service gets wrong asserts what it does **today**, under a marker saying
what it should do instead. The spec and the DSL step name the intent, which survives the fix; the
driver method names today's status, and is what the fix renames.

```ts
// DocumentsCurrentBehavior: replies 500. Should be 400.
it('rejects a harvest list that is missing', async () => {
```

`grep -rn DocumentsCurrentBehavior test/acceptance` lists them. When one is fixed, its test goes red:
rename the driver method, update the DSL line, delete the marker, and remove its row here.

| Area | Today | Should be |
| --- | --- | --- |
| Plants | An unknown `plantId` with a taken name answers 404, having overwritten the plant holding the name | Rejected, changing nothing |
| Plants | `sowing.indoor` and `.direct` come back as `"1"` and `"0"`, and `planting.depthInInches` as a string | The booleans and number sent |
| Plots | A taken name answers 201 with an id that doesn't exist, having overwritten the plot holding it | Rejected, changing nothing |
| Plots | A write answers `isActive: true`, a read answers `1` | The same on both |
| Plots | `isActive: false` is ignored | Deactivates the plot |
| Harvests | Plant stats report `statsType: "Planting"` | `"Plant"` |
| Activity schedules | `PATCH` blanks whatever it wasn't sent | Keeps it |
| Activity schedules | Updating an item through a schedule that doesn't hold it succeeds | 404 |

## The DSL dependency

`@feral-auth/ts-simple-dsl` is pinned to an exact version in `devDependencies`. It is pre-1.0 and
ships breaking changes in patch releases, so upgrading should be a decision, not a side effect of
`npm install`.

## Adding a test

1. Write the spec first, in the words you wish existed, reusing steps where they say the right thing.
2. Add the step to `dsl/*-dsl.ts`: declare its parameters with `parseDslArgs`, resolve aliases and
   the caller through the world, and delegate. It returns `Promise<void>`, and files anything it
   produces in the world.
3. Add the driver method: caller first, then typed arguments. An arranger acts, asserts success,
   registers what it made for teardown and returns it. An expectation acts and asserts.
4. Need a new kind of check? Add a primitive to `drivers/assertions.ts`.
5. Run the suite. Steps take strings, so `tsc` can't check a prose call.
