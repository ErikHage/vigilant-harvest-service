# Acceptance testing plan

A working plan for adding a black-box acceptance-test DSL suite to vigilant-harvest-service, built
like feral-authentication-service's `test/acceptance/`, with every row the tests create removed
by the end of a run.

This file tracks progress as the work goes. It is **temporary**. Delete it once every phase is
done, because the history belongs in `ai-changelogs/projects/vigilant-harvest-service/`. Unlike
the changelogs it isn't append-only: tick items off, edit the plan when it changes, and record
anything that changed course in the progress log at the bottom.

- **Started:** 2026-10-29
- **Status:** Phases 0–2 done; Phase 2 awaits review and commit
- **Changelog:** `ai-changelogs/projects/vigilant-harvest-service/2026-02-21-1-testing.md`. Append
  an entry before each commit; the delete APIs get their own file in Phase 2.
- **Reference suite:** `../feral-authentication-service/test/acceptance/`. Its README and
  `ai-changelogs/projects/feral-authentication-service/2026-08-31-2-acceptance-test-adoption.md`
  explain the pattern.
- **Conventions:** the `dsl-tests` skill (four layering rules, steps, drivers, pinned behaviour).

---

## Status at a glance

| Phase | What | Status |
|---|---|---|
| 0 | Local prerequisites (test user, env, both services running) | done (`54c5373`) |
| 1 | Test setup: drop jest, adopt feral's test layout | done (`6001d0e`) |
| 2 | Service changes: delete APIs needed for cleanup | done; awaiting review and commit |
| 3 | Suite scaffolding, preflight, teardown, residue check, first specs | not started |
| 4 | Specs per API grouping | not started |
| 5 | Prove the suite can fail, layering checks, docs | not started |
| 6 | Upgrade to vitest 5 and Node 24 | not started |

---

## Decisions

Agreed with the user on 2026-10-29.

1. **Tokens come from logging in through the running feral-authentication-service**, as a
   local-only test user with a grant to the Vigilant Harvest application.
   - This is how the real app gets its tokens.
   - The suite needs no private key.
   - A run pointed at a live service fails at login, because the user only exists locally.
   - Rejected alternative: minting RS256 tokens with a suite-owned key pair. That would mean
     starting the service with a test `SESSION_PUBLIC_KEY` and keeping a private key in the test
     tree.
2. **A delete that targets a record with children refuses it with 409 Conflict.**
   - Children are records a user made and could care about: plantings under a plant, harvests
     under a planting, plantings in a plot or year, plants in a subcategory, subcategories in a
     category, journal and log entries in a year.
   - Internal rows are deleted with their owner, in the same transaction: status history,
     planting-year mappings, plant-to-schedule links.
   - Rejected alternative: cascading deletes. They make teardown easier, but one click in the app
     could wipe a plant's whole history.
3. **The guarantee that test data is gone is a global teardown that checks for residue through
   the API**, and fails the run if any test data survives.
   - The suite stays black-box: no database credentials, no SQL in the suite.
   - The API can't see internal tables. Because of decision 2, residue at the top level is enough
     to prove those tables are clean:
     - no test planting years left → no plantings, journal entries or log entries in them
     - no test plantings left → no harvests, status history or year mappings
   - The README carries orphan-check SQL to confirm this by hand.
   - Rejected alternatives: a read-only DB check in teardown, and a DB sweep that deletes
     leftovers. A sweep would hide a broken delete endpoint, which is exactly what the check is
     there to catch.
4. **Move the project from jest to vitest, and lay `test/` out like feral's (Phase 1).** Agreed
   with the user on 2026-10-29, superseding the first draft of this plan, which kept jest +
   ts-jest.
   - Jest barely appears here: one config, one setup file, one test and three dev dependencies.
   - **The existing in-process test is deleted, not migrated** (the user's decision, 2026-10-29).
     - It only checks `GET /service-info`, which the acceptance suite's `service-info.spec.ts`
       covers against the running service.
     - Deleting it leaves `test/` holding only `test/acceptance/`, exactly as in feral.
     - jest, ts-jest, supertest and their types all leave the dependencies.
     - A `test/integration/` suite in the recipes-service DSL pattern stays possible later, if
       an in-process need appears.
   - `test/` gets feral's shape:
     - it's excluded from the root tsconfig, so it never reaches `dist/`;
     - each suite has its own `tsconfig.json`;
     - `test/.eslintrc` points lint's parser at it.
   - Under vitest, feral's `drivers/assertions.ts`, `dsl/dsl-misuse.ts`, config and preflight
     port almost as-is.
   - `expect(value, message)` takes a custom message, so the failure-message workaround jest
     would have needed goes away.
   - Serial runs are a config setting (`fileParallelism: false`), with a separate `hookTimeout`.
   - The project stays CommonJS for `tsc` and the build. `@feral-auth/ts-simple-dsl` ships both
     ESM and CJS builds, so either resolution works.
5. **Known-wrong behaviour is pinned, not skipped.** A test asserts what the service does today,
   under a `// DocumentsCurrentBehavior: replies X. Should be Y.` marker. The spec title and DSL
   step name the intent, and the driver method names today's status. Each 500 is paired with a
   control that re-reads the data.
6. **No commits by Claude.** Work is left uncommitted for the user.

---

## Phase 0: Local prerequisites

Goal: a machine where both services run locally and the suite has a user to log in as.

- [x] **Create the test user `vigilant-test-gardener` in the local `feral_auth` database.**
  - Done on 2026-10-29 **through feral's API**, logged in as `feral-test-admin` (credentials from
    feral's gitignored `test/acceptance/.env.acceptance`). The steps were:
    1. `POST /users`: username `vigilant-test-gardener`, first name `Vigilant`, last name
       `Test Gardener`, email `vigilant-test-gardener@example.test`, and a random password.
       This created userId `b41b463e-770b-42d1-b632-ba03c7d3e418`.
    2. `POST /users/:userId/applications` with `{ "applicationIds": [<Vigilant Harvest id>] }`.
       This *replaces* the user's grants, which is harmless for a new user.
  - Feral's login refuses any application but its own (scope `feral`) unless the user holds a
    grant (`checkGranted` in feral's `authentication-service.ts`). Without step 2, login gives
    403.
  - The password is only in `test/acceptance/.env.acceptance`. `.gitignore` now lists it, and
    `git check-ignore` confirms the rule.
  - No SQL seed was written, since this machine's ids differ from the seed scripts. Phase 3's
    README documents these API steps for another machine.
- [x] **Confirm the service's `SESSION_PUBLIC_KEY` matches the key feral signs Vigilant Harvest
  sessions with.** It does. Feral's `GET /keys` doesn't expose public keys, so the check was a
  real login: the gardener's token for the Vigilant Harvest app verifies (RS256, `iss:
  feral-auth`) against the `SESSION_PUBLIC_KEY` active in `.env`.
  - The token's claims are `sessionId, userId, username, applicationId, roles, expiration, iat,
    iss, exp`.
  - The Vigilant Harvest app shares key pair `063f7b9c-...` with Feral Authentication and
    Voracious Appetite.
- [x] **The Vigilant Harvest application id** is `82d7d287-978b-4df1-bc3d-526838b2465b`
  (scope `vigilant`).
- [x] **Both services start.**
  - feral-authentication-service was already running on `:8003`.
  - This service was started with `npm run dev` and answered within seconds on `:8002`.
  - Probes made as the gardener:
    - `GET /service-info` → 200
    - `GET /harvest-types` → 200 with 19 types
    - `GET /harvest-types` without a token → 401
- **What the local database already holds** (real dev data the suite must never touch): 27
  plants, 7 plots, 14 categories, 3 planting years, 4 activity schedules, 59 plantings.
- **Found in passing:** feral's local `feral_auth` database holds 972 applications, and about
  955 of them are leftovers from feral's own suites:
  - 797 `ui-game-*`
  - 157 `acc Application *`
  - more `ui-renamed-*` and `ui-app-*`

  That is exactly the residue this plan's teardown and residue check exist to prevent here. It
  is out of scope for this plan; tell the user.

---

## Phase 1: Test setup: drop jest, adopt feral's test layout

Goal: jest, supertest and the old in-process test are gone; `test/` is laid out like
`../feral-authentication-service/test/`, ready for Phase 3 to fill in; and nothing about the
service itself changes. The review behind this phase is Appendix C.

### What's there today

- `jest.config.ts`:
  - `preset: 'ts-jest'`, `testEnvironment: 'node'`
  - `testMatch: ['**/test/**/*.test.ts']`
  - `testTimeout: 30000`
  - `setupFiles: ['./test/setup.ts']`
  - ignores `dist/`
- `test/setup.ts`: loads dotenv, builds the app in-process with `getApp(__dirname, '8102')`, and
  exports a supertest `client`.
- `test/service-info.test.ts`: the only test. It uses jest's globals, imports `../package.json`,
  and checks `GET /service-info`.
- In `package.json`: `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`, and the
  script `"test:int": "jest"`.
- The root `tsconfig.json` has no `include` or `exclude`, so `tsc` compiles `test/`,
  `jest.config.ts` and `tools/` into `dist/` (T-1).

### Target layout

Matches feral's:

```
test/
  .eslintrc                    { "parserOptions": { "project": "./test/acceptance/tsconfig.json" } }
  acceptance/
    tsconfig.json              extends ../../tsconfig.json; noEmit, module esnext,
                               moduleResolution bundler, types [node],
                               include ["./**/*.ts"], exclude []
    vitest.config.ts           placeholder now; Phase 3 fills it in
    ...                        everything else arrives in Phase 3
```

Copy feral's `test/.eslintrc` and `test/acceptance/tsconfig.json`. Check that feral's
`typeRoots` entry (`../../types`) applies here. This project has no `types/` folder, so drop it.

### Steps

- [x] Delete `test/service-info.test.ts`, `test/setup.ts` and `jest.config.ts` (T-2, T-3, T-4, T-6).
- [x] `npm uninstall jest ts-jest @types/jest supertest @types/supertest`. Only `test/setup.ts`
  used supertest.
- [x] Remove the `test:int` script (T-5). Phase 3 adds `test:acceptance` and
  `test:acceptance:watch`.
- [x] Install **`vitest ^4.1.12`**, and bump **`@types/node` from `^18.16.2` to `^20.19.43`**.
  - The plan said vitest 5. npm refused it: vitest 5.0.5 declares Node `^22.12 || ^24 || >=26`
    and a peer `@types/node` of `^22 || >=24`, while the project has `@types/node ^18` and
    builds its Docker image on `node:20-alpine`.
  - The user chose vitest 4 (Node 20, 22 and 24+), with `@types/node` matching the Docker
    runtime, and asked for the vitest 5 / Node 24 upgrade as the last step (Phase 6).
  - Keep the `^` range like the other dev dependencies; only the DSL library is pinned exactly.
  - Feral is still on `vitest ^1.6.0`. The gap is noted in the changelog in case something
    ported from feral behaves differently.
- [x] Root `tsconfig.json`: add `"exclude": ["node_modules", "dist", "test"]`, as feral has (T-1).
- [x] Add `test/.eslintrc`, so `npm run lint` keeps covering `test/` once the root tsconfig
  excludes it (T-10).
- [x] Add `test/acceptance/tsconfig.json` (feral's, without `typeRoots`), and
  `test/acceptance/vitest.config.ts` with feral's settings minus `globalSetup`, which Phase 3
  adds with the setup files. With no specs yet, `vitest run` reports "No test files found", so
  the scripts come in Phase 3.
- [x] `npm run clean` (part of `npm run build`), so the stale `dist/test/` and
  `dist/jest.config.js` are gone.
- Moved to Phase 6: the Dockerfile's `node:24-alpine` bump (T-7).

### Done when

- `npm run build` is clean, and `dist/` has no `test/` or `jest.config.js`.
- `npm run lint` still covers `test/`: a deliberate lint error in a scratch file under
  `test/acceptance/` is reported, then removed.
- `git grep -niE "jest|supertest"` finds only this plan.

All met on 2026-10-29:
- `npm run build` is clean, and `dist/` holds `src/`, `tools/`, `migrations/`, `database.json`
  and `package.json` only.
- `npx tsc -p test/acceptance/tsconfig.json` is clean.
- A lint probe in `test/acceptance/` was reported (an unused variable and double quotes), then
  deleted.
- `npx vitest run --config test/acceptance/vitest.config.ts` loads the config and finds no
  specs, as expected.
- **Coverage gap, accepted:** the project has no tests between this phase and Phase 3's first
  spec. The deleted test only checked `/service-info`, and Phase 3's `service-info.spec.ts`
  restores that check against the running service.

---

## Phase 2: Service changes needed for cleanup

Goal: every record a test can create can also be deleted through the API, and no delete leaves
orphans behind.

### Why

Creating a plant requires a subcategory, and a subcategory requires a category. Neither can be
deleted today, so even the simplest test leaves residue. The full list of what can't be deleted
today:
- plant categories and subcategories
- planting years (the PK is the year itself, `planting_years.planting_year INTEGER`)
- activity schedules (the database would cascade to their items, but there is no endpoint)
- journal entries and activity-log entries

The deletes that do exist are single-row hard deletes that orphan dependants. The schema has only
3 foreign keys: `plants.default_harvest_type_id`, `harvests.harvest_type_id` and
`activity_schedule_items` → `activity_schedules` (ON DELETE CASCADE).

- `DELETE /plantings/:id` (and the `DELETE` action) leaves its `planting_status_history`,
  `planting_planting_years` and `harvests` rows.
- `DELETE /plants/:id` succeeds even with plantings. Those plantings keep a dangling `plant_id`
  and drop out of planning and stats queries, which inner-join `plants`. Its
  `plants_activity_schedules` links are left too.
- `DELETE /plots/:id` leaves `plantings.plot_id` dangling. `getHydratedHarvestsByYear`
  inner-joins `plots`, so those harvests disappear from stats.

### Shared groundwork

- [x] Add `ConflictError` (status 409) to `src/errors/common.ts`, plus `CONFLICT: 409` in
  `src/util/http-status.ts`.
- [x] Add `db.execCountQuery`, for queries that select a single `COUNT(*) AS count`, with a
  `CountRow` type in `src/database/types.ts`. Every "in use" check uses it.
- [x] **Run "in use" checks outside the services' `try { ... } catch { throw new FeralError(...) }`
  rewrap.** That rewrap forces every error to 500, so a 409 thrown inside it comes out as a 500.
  Follow the lifecycle check at `src/services/plantings/plantings-service.ts:39`, which sits
  outside the `try` for this reason.
- [x] Multi-row deletes go through `db.execTransactionQuery`.
  - **B9 fixed:** `beginTransaction` now sits inside the `try`, so the `finally` always closes
    the connection.
  - A failing rollback is logged instead of thrown, so it can't hide the error that caused it.

### New endpoints

| Endpoint | Removes | 409 when | Files |
|---|---|---|---|
| `DELETE /plant-categories/:categoryId` | the category | it still has subcategories | plants service, datasource and queries (categories live there), plant handlers, router |
| `DELETE /plant-categories/:categoryId/plant-subcategories/:subcategoryId` | the subcategory | any plant has that `subcategory_id` | same |
| `DELETE /planting-years/:plantingYear` | the year | any planting has it as `current_planting_year` or in `planting_planting_years`, or any harvest, journal entry or activity-log entry references it | `planting-years/*`, planting-year handlers |
| `DELETE /activity-schedules/:activityScheduleId` | the schedule; items go by the existing FK cascade; `plants_activity_schedules` links are removed in the same transaction | never (links are join rows, not children) | `schedules/*`, schedule handlers |
| `DELETE /journal/entries/:entryId` | the entry | never | `journal/*`, journal handlers |
| `DELETE /activity-log/entries/:entryId` | the entry | never | `activity-log/*`, activity-log handlers |

- [x] `DELETE /plant-categories/:categoryId`
- [x] `DELETE /plant-categories/:categoryId/plant-subcategories/:subcategoryId`
- [x] `DELETE /planting-years/:plantingYear`
- [x] `DELETE /activity-schedules/:activityScheduleId`
- [x] `DELETE /journal/entries/:entryId`
- [x] `DELETE /activity-log/entries/:entryId`

The `/entries/` segment keeps a delete-by-UUID apart from the existing
`GET /journal/:plantingYear` and `GET /activity-log/:plantingYear`. Rename it freely before it
ships.

Status codes: match the existing deletes.
- Plants, plots, plantings and harvests answer 200 "OK", and so do the new category,
  subcategory, planting-year, journal and activity-log deletes.
- Schedule items answer 204, and so does the new schedule delete.
- A non-numeric category, subcategory or year id answers 400. The handler returns early, so a
  `NaN` never reaches SQL (unlike S-NaN elsewhere).
- Deleting an unknown id answers 200 today, not 404. That's fine for best-effort teardown and
  isn't changed here.
- A 409 body is the usual `{ errors: [...] }`. Its `debugParams` say what blocked the delete: a
  count, or for a planting year the breakdown `{ plantings, plantingMappings, harvests,
  journalEntries, activityLogEntries }`.
- The subcategory delete matches on both `category_id` and `subcategory_id`, so a subcategory
  can't be deleted through another category's path.

### Changes to existing deletes

- [x] **Plantings.**
  - `DELETE /plantings/:id` and the `DELETE` action (`src/services/plantings/actions/delete-action.ts`)
    go through one datasource method.
  - 409 if the planting has harvests.
  - Otherwise delete the planting, its `planting_status_history` rows and its
    `planting_planting_years` rows in one transaction.
  - The action keeps its existing rule that it's only allowed from CREATED.
  - The harvest check is a `_assertNoHarvests` in `plantings-service.ts`, called before the
    rewrapping `try` by both `deletePlantingById` and `performAction` (for DELETE). Inside
    `DeleteAction` it would have become a 500.
  - A RETIRED planting can only take COMMENT actions, so teardown must use
    `DELETE /plantings/:id`, which has no status rule.
- [x] **Plants.** `DELETE /plants/:id` answers 409 if any planting references the plant. Otherwise
  it deletes the plant and its `plants_activity_schedules` links in one transaction.
- [x] **Plots.** `DELETE /plots/:id` answers 409 if any planting has that `plot_id`.

### Risk to check before merging

The plant and plot deletes now refuse cases they allow today. Before merging, check how
`../vigilant-harvest-app` calls them, and decide whether the app needs a message for the 409.

**Checked 2026-10-29: no impact.**
- The app's store has a `deletePlantById` action, but no component calls it.
- The app never deletes plots.
- Its planting Delete action is offered only for CREATED plantings. A refusal there (a CREATED
  planting with harvests) surfaces through the store's existing error alert.

### Done when

- All of the above work by hand with curl against a local service.
- `npm run build` is clean.
- The suite from phases 3 and 4 covers each endpoint; it is the real proof.

**Met on 2026-10-29.**
- `tsc` and `npm run lint` are clean, and nodemon's rebuild (`npm run build`) passed.
- A throwaway smoke script exercised every endpoint against the running service: 50 checks, all
  passing. Its last check, a catch-all `acc-smoke-%` SQL count, had a column-name bug in the
  script; it was rerun on its own and returned 0 across every table.
  - Data: an `acc-smoke-*` category, subcategory, plant, plot, schedule with an item, two
    plantings, two harvests, and a journal and an activity-log entry, all in planting year 9411.
  - Each 409 fired while its dependant existed. The year's 409 reported
    `{"plantings":2,"plantingMappings":2,"harvests":0,"journalEntries":1,"activityLogEntries":1}`.
  - Each delete succeeded once its dependants were gone, and the non-numeric ids answered 400.
  - Afterwards nothing was left: through the API, and in SQL across status history, year
    mappings, harvests, schedule links and schedule items.
- The script lives outside the repo. Phase 4's specs replace it.

**Found while testing, and important for Phase 3:**
- **Dates in a 9xxx test year can't be stored.** `harvests.date_created`,
  `garden_journal.entry_date` and `garden_activity_log.entry_date` are MySQL `TIMESTAMP`s, which
  end in 2038. A harvest dated `9411-07-01` gets a 500 ("Incorrect datetime value").
  - So the test year stays a 9xxx *label*, and harvest and entry dates use real-era dates.
  - The service never ties those dates to `plantingYear`.
  - `planting_years` date columns are `DATE`, so a test year's own frost and target dates can be
    in 9xxx.
- **The local database already has orphans from the old deletes:**
  - 25 `planting_status_history` rows whose planting is gone
  - 1 harvest whose planting is gone

  They predate this change. The README's orphan-check SQL must expect them, or be scoped to the
  suite's own ids, or it will report them as the suite's residue.
- `entry_date` values come back shifted by the local UTC offset: `9411-06-01` was sent, and the
  error showed `9411-05-31 20:00:00`. This may be a timezone bug in the journal and log date
  handling. Not chased here; add it to Appendix A if a spec confirms it.

---

## Phase 3: Suite scaffolding

Goal: the whole skeleton running green against the local services, with the first few specs, the
preflight and the residue check in place, before the specs are filled in.

### Packages and wiring

- [ ] `npm install --save-dev --save-exact @feral-auth/ts-simple-dsl@0.0.1`. Pin it exactly: the
  library is pre-1.0 and ships breaking changes in patch releases. feral, recipes-service and
  feral-authentication pin 0.0.1.
- [ ] Add the scripts, as in feral:
  - `"test:acceptance": "vitest run --config test/acceptance/vitest.config.ts"`
  - `"test:acceptance:watch": "vitest --config test/acceptance/vitest.config.ts"`
- [ ] Finish `test/acceptance/vitest.config.ts` (a placeholder since Phase 1), starting from
  feral's:
  - `root: process.cwd()`
  - `include: ['test/acceptance/specs/**/*.spec.ts']`. It's the project's only vitest config.
  - `globalSetup: ['test/acceptance/setup/global-setup.ts', 'test/acceptance/setup/global-teardown.ts']`.
    Vitest has no separate global-teardown option. A global-setup module's exported `teardown`
    (or the function its `setup` returns) runs after all specs, so the residue check lives in
    `global-teardown.ts` as an exported `teardown`.
  - `testTimeout: 15000`, `hookTimeout: 20000`
  - `fileParallelism: false`, because every spec shares one database, and plant, plot, category
    and subcategory names are unique keys.
  - `reporters: ['verbose']`
  - **No** `setupFiles`. Nothing may build the app in-process; a black-box suite only calls the
    running service.
- [ ] Gitignore `test/acceptance/.env.acceptance`, and commit `test/acceptance/.env.acceptance.example`.
- [ ] The suite type-checks under `test/acceptance/tsconfig.json` (from Phase 1), never reaches
  `dist/`, and is linted through `test/.eslintrc` with the repo's rules: kebab-case filenames,
  single quotes, trailing commas, `array-bracket-spacing`, `no-floating-promises`.
  - `no-console` is a warning, so teardown and preflight messages go to `process.stderr`.
- [ ] Add `"tsc:acceptance": "tsc -p test/acceptance/tsconfig.json"`, to type-check the suite;
  feral runs the same check by hand. Keep it out of `build`, because the Docker build doesn't
  copy `test/`.

### Layout

Mirrors feral. Every file name is kebab-case.

```
test/acceptance/
  README.md
  vitest.config.ts
  .env.acceptance.example
  setup/
    config.ts              loads .env.acceptance (shell overrides win), validates, refuses non-local hosts
    global-setup.ts        preflight
    global-teardown.ts     exports teardown(): the residue check; fails the run on leftovers
  support/
    http-client.ts         the only fetch(); never throws on non-2xx; ServiceUnreachableError on network failure
    status-codes.ts        re-declared, never imported from src/
    test-context.ts        config, drivers, teardown registry, actor tokens
    resources.ts           CreatedPlant, CreatedPlanting, ... and TrackedResource
    fixtures.ts            aPlant(), aPlot(), aPlanting(), ... builders
    actors.ts              Actor = { token, username }; ANONYMOUS_ACTOR
    residue.ts             lists leftover test data through the API; shared by setup and teardown
  drivers/
    assertions.ts          the only importer of vitest's expect (custom message as its second argument)
    drivers.ts             assembles every driver over one tokenless client
    <grouping>-driver.ts
  dsl/
    acceptance-dsl.ts      the one import a spec makes: createAcceptanceDsl()
    world.ts               aliases, actorFor, default parents, test-year allocation
    params.ts              alias(), actor(), outcome(...), ...
    dsl-misuse.ts          expectStepRejected(...)
    <grouping>-dsl.ts
  specs/
    <grouping>.spec.ts
    dsl-misuse.spec.ts
```

The groupings follow `src/routes/api-router.ts`:
- service-info, auth
- plant-categories (with subcategories), plants, plots
- planting-years, plantings, planning
- harvests, harvest-types
- journal, activity-log
- activity-schedules (with items)

### Config (`setup/config.ts`, `.env.acceptance.example`)

| Key | Default / example | Notes |
|---|---|---|
| `ACCEPTANCE_BASE_URL` | `http://localhost:8002/api/vigilant-harvest-service/v0` | must be a local host |
| `ACCEPTANCE_AUTH_URL` | `http://localhost:8003/api/feral-authentication-service/v0` | must be a local host |
| `ACCEPTANCE_USERNAME` | `vigilant-test-gardener` | local-only user |
| `ACCEPTANCE_PASSWORD` | *(blank in the example)* | only in `.env.acceptance` |
| `ACCEPTANCE_APPLICATION_ID` | the Vigilant Harvest application id | |
| `ACCEPTANCE_REQUEST_TIMEOUT_MS` | `10000` | optional |

- Missing values throw an `AcceptanceConfigError` that says to copy the example file.
- Any host other than `localhost`, `127.0.0.1` or `::1` throws. The suite writes and deletes
  data, so it must be unable to point at a live service. This mirrors the guard the
  feral-authentication UI suite added after its incident.

### Actors

`as:` is required on every step that reaches the service, and goes first. The service checks no
roles, so almost every step reads `as: gardener`. That's deliberate: the caller is part of what a
step depends on, and `anonymous` and `forged` are what the auth spec is about.

Reserved names, resolved by `world.actorFor`:
- `gardener`: the test user. Logged in lazily on feral (`POST /login` with username, password and
  applicationId), and the token is cached per spec file.
- `anonymous`: no token.
- `forged`: an RS256 JWT with `iss: feral-auth` and a plausible payload, signed by a key pair the
  suite generates at runtime with `node:crypto` `generateKeyPairSync`. It never imports from `src/`.

Other names aren't valid: the suite creates no users, since users live in feral.

- The feral login call goes through `support/http-client.ts`, a second client instance with the
  auth base URL, so `fetch(` still appears in exactly one file.
- The token is sent as `x-feral-auth-token`.

### Names and the world

- Dates on harvests and on journal and activity-log entries must stay within MySQL `TIMESTAMP`
  range (1970–2038), whatever the test year is (see Phase 2's findings). Use dates near today.
- Anything with a name gets `acc-<alias>-<6 hex>`: plants, plots, categories, subcategories,
  schedules, planting names. The plant, plot, category and (per category) subcategory names are
  unique keys, and the database is never reset.
- **Planting years are integers, and real years must never be touched.** The world gives each
  year alias a random year in **9000–9999** that isn't already in use, and remembers it for the
  spec. That range is the "prefix" for years. When it picks a year, the world also checks
  `GET /planting-years`, so leftovers from a crashed run can't collide.
- Parents a spec doesn't name are created for it:
  - `plants.createPlant('as: gardener', 'plant: tomato')` with no `subcategory:` uses a per-spec
    default category and subcategory, created lazily and registered for teardown.
  - `plantings.createPlanting('as: gardener', 'planting: row-one', 'plant: tomato')` with no
    `year:` uses a per-spec default test year.
  - A spec names the parent when the test is *about* it.
- Driver arrangers register what they create before returning, including what the service makes
  as a side effect:
  - **SPLIT creates new plantings.** The driver registers each child it finds in the response,
    or by re-reading the year's plantings.
  - A harvest **merge** folds one row into another. The absorbed row's delete then answers 200
    and is a harmless no-op.
  - A plant–schedule **assignment** is removed by deleting either side, so it isn't registered.
- Seeded harvest types are read, never created, and never registered.

### Teardown (`support/test-context.ts` → `world.cleanup`, passed to `afterEach`)

1. Forget every alias first, so a later test can't resolve a name to something deleted.
2. Delete everything registered, **newest first**, as `gardener`.
3. **Retry what was refused with 409**, in further passes, until a pass deletes nothing.
   - Newest-first doesn't always respect dependency order. A plot created *after* the planting
     placed in it is newer, so it's deleted first and refused; it succeeds on the next pass.
   - Retrying costs nothing, and is simpler than giving every resource kind a fixed rank.
4. Write each delete that still failed to stderr: resource kind, label, status and truncated body.
5. **Never throw.** A teardown problem must not mask the test's own failure. The global teardown
   is where leftovers fail the run.

Unlike feral, which ignores teardown statuses, this teardown reads them, because the user wants a
guarantee rather than best effort.

### Preflight (`setup/global-setup.ts`)

Each check turns one way the suite can be misconfigured into one message that names the fix:

1. `GET /service-info` with no token. Unreachable → "start vigilant-harvest-service
   (`npm run dev` or `../start-vigilant-harvest.sh`)".
2. `POST /login` on feral. Unreachable → "start feral-authentication-service". A non-200 → check
   `ACCEPTANCE_USERNAME`, `ACCEPTANCE_PASSWORD` and `ACCEPTANCE_APPLICATION_ID`, and that the
   user has the Vigilant Harvest grant.
3. `GET /harvest-types` with that token:
   - a 500 → `SESSION_PUBLIC_KEY` probably doesn't match feral's key (a bad token is 500 today,
     not 401; finding S-B1)
   - an empty list or a DB error → run the migrations
   This works because harvest-types needs auth, needs a migrated database, and has 19 seeded rows.
4. Run `support/residue.ts` and **warn** (not fail) if residue from an earlier run exists, with a
   pointer to the README's cleanup SQL. The global teardown would fail anyway, so the warning
   just makes the cause clear up front.

### Residue check (`setup/global-teardown.ts`, using `support/residue.ts`)

This logs in once as `gardener` (vitest's global setup and teardown run in the main process,
outside the specs' context) and lists:
- `GET /plant-categories`: categories named `acc-%`, and subcategories named `acc-%` in any
  category
- `GET /plants` and `GET /plots`: names starting `acc-`
- `GET /activity-schedules`: names starting `acc-`
- `GET /plantings`: names starting `acc-`
- `GET /planting-years`: any year in 9000–9999
- for each such year: `GET /journal/:year` and `GET /activity-log/:year`

If anything is found, it throws an error naming each leftover, and the run fails.
- [ ] Confirm during implementation that an error thrown from a global-setup `teardown` makes
  `vitest run` exit non-zero and prints the message. Feral never needed this: it has no global
  teardown. If it doesn't, set `process.exitCode = 1` as well.

### First specs, to prove the skeleton

- [ ] `service-info.spec.ts`: reachable with no token, and reports its name.
- [ ] `auth.spec.ts`:
  - no token → 401
  - a forged token → pinned 500, "Should be 401" (finding S-B1)
  - a malformed token → same
  - a real token → 200 (the control)
- [ ] `dsl-misuse.spec.ts`: a misspelled parameter, and a parameter passed to a step that takes
  none. Its checks go through `drivers/assertions` (the recipes-service style), so `expect` is
  still imported in only one file.
- [ ] A first data spec end to end. `plant-categories.spec.ts` is the obvious one: it exercises
  the new deletes, the teardown and the residue check together.

### Done when

The skeleton is green, the layering greps (Phase 5) hold, and running it twice in a row leaves
no residue.

---

## Phase 4: Specs per API grouping

Drivers assert only on what the spec itself created, or on invariants. Other data in the
database is someone's real garden. Each bullet below becomes one `it(...)` or a small group.
"Pinned" means a `DocumentsCurrentBehavior` test, and the finding id points into the appendix.

### plant-categories
- [ ] Create a category and see it listed with no subcategories.
- [ ] Add a subcategory and see it under its category.
- [ ] A duplicate category name → pinned 500, should be 409 (B-dup). Control: the list still
  shows one.
- [ ] A duplicate subcategory name in the same category → pinned 500, should be 409. The same
  name under another category succeeds.
- [ ] Deleting a category that still has subcategories → 409. Deleting a subcategory a plant uses
  → 409.
- [ ] Deleting an empty subcategory, then the empty category, → gone from the list.

### plants
- [ ] Create, get and list. Fields round-trip: taxonomy, sowing, planting, growing, harvesting,
  tags, lifespan type.
- [ ] A plant with no `defaultHarvestTypeId` gets `unspecified` (id 1). A chosen default is kept.
- [ ] Update by `plantId`. The response and a re-read agree.
- [ ] Assign and unassign activity schedules. Both `assign` and `unassign` must be arrays, else 400.
- [ ] Assigning the same schedule twice → pinned 500, should be 409 or idempotent.
- [ ] An unknown plant id → pinned 500, should be 404 (S-NF).
- [ ] Creating a plant whose name is taken overwrites the other plant → pinned (B-overwrite).
  Control: the first plant's details are now the second's.
- [ ] An unknown `subcategoryId` → pinned 500 that leaves an orphan row holding the name
  (B-orphan). **The driver must find that row, by listing or by name, and register it for
  teardown**, or it becomes residue.
- [ ] Deleting a plant with plantings → 409. Deleting it after its plantings are gone → gone, and
  its schedule links with it.

### plots
- [ ] Create (201), update (200), get, list, delete.
- [ ] `isActive` is always true → pinned (B-plot).
- [ ] A PUT echoes the input, not the stored row → pinned if a test can show the difference.
- [ ] A taken name overwrites the other plot, and the response holds a plotId that doesn't exist
  → pinned (B-overwrite).
- [ ] Deleting a plot a planting is in → 409.

### planting-years
- [ ] Create a test year (201, plain-text "Created"), then get and list it.
- [ ] Creating it with `previousPlantingYear` set to another test year carries that year's
  PLANTED plantings into it.
- [ ] `details` counts are always 0 → pinned (B-details), with a planting in the year as the
  control.
- [ ] A duplicate year → pinned 500, should be 409.
- [ ] Deleting a year with plantings, harvests, journal or log entries → 409. Deleting an empty
  year → gone.

### plantings
- [ ] Create: 201, status CREATED, and a get shows one history entry plus the year mapping.
- [ ] The lifecycle CREATED → START (`sowDate`, `numberSown`) → PLANT (`plotId`,
  `transplantDate`, `numberTransplanted`) → RETIRE. Each step adds a history entry.
- [ ] A COMMENT adds a history entry without changing status.
- [ ] SPLIT into named parts: the counts add up, and the children exist and are cleaned up.
- [ ] A split that overflows the count → pinned 500, should be 400.
- [ ] An action out of lifecycle order → 400. This one is correct today, since the check sits
  outside the rewrap.
- [ ] Update with a field allowed for the status → 200. A field not allowed for the status →
  pinned 500, should be 400 (S-rewrap).
- [ ] The DELETE action from CREATED → gone. The DELETE action from a later status → 400.
- [ ] `DELETE /plantings/:id` with harvests → 409; without harvests → gone.
- [ ] `GET /plantings?plantingYear=` lists the spec's plantings. A non-numeric year → pinned 500
  (S-NaN).

### harvests
- [ ] Upsert one harvest: 201, and it inherits the plant's default harvest type.
- [ ] A per-harvest `harvestTypeId` override is kept. Changing the plant's default afterwards
  doesn't rewrite it.
- [ ] Two harvests on the same planting, day and type fold into one, with the quantities summed.
- [ ] Summary, search and stats (Plant and Planting): the spec's harvests appear, filtered to its
  own plantings.
- [ ] Harvests are stored under the **current calendar year**, not the planting's year → pinned
  (B-year). So summary and search for the test year find nothing. Assert both halves: missing
  under the test year, present under the current year.
- [ ] A body without `harvests` → pinned 500, should be 400.
- [ ] Delete → gone.

### harvest-types
- [ ] The list contains `unspecified` and is non-empty. Don't assert the exact 19, because the
  list is seed data.

### planning
- [ ] For a test year with a target planting date: a CREATED planting whose lead time is due
  appears in `toStart`, and a STARTED one appears in `toPlant`.
- [ ] A non-numeric year → pinned 500 (S-NaN).

### journal and activity-log
- [ ] Upsert (201 when new, 200 with `entryId`), then list by year.
- [ ] Delete through the new endpoint → gone from the list.
- [ ] A missing `entryDate` → pinned 500, should be 400.

### activity-schedules
- [ ] Create (201, no items), get, list, update. Update overwrites both fields → pin it if
  omitting one blanks it.
- [ ] Add, update and delete items (204).
- [ ] An item PATCH under the wrong schedule id still updates → pinned (B-item).
- [ ] Deleting a schedule removes its items, and unassigns it from plants (checked through the
  plant).

---

## Phase 5: Prove it, check it, document it

### Prove the suite can fail

A suite written fresh passes on its first run, which proves nothing. Break the service in a few
targeted ways (by hand, then revert) and check that each break fails exactly what should notice:

- [ ] Drop the status-history delete from the planting delete transaction. The orphan SQL in the
  README should show rows. This break is invisible to the API, which is why that SQL exists.
- [ ] Make one teardown delete a no-op (or point it at a wrong path). The global teardown must
  fail the run and name the record.
- [ ] Remove the 409 check from the plant delete. The plant-delete test must fail.
- [ ] Break one serializer field (e.g. rename `friendlyName` in `serializers/plants.ts`). Only
  the tests that read it should fail.
- [ ] Set `fileParallelism: true` (or pass `--fileParallelism`) and run once. Note what collides, if anything;
  the default stays serial.

### Layering checks (from the dsl-tests skill)

- [ ] `grep -rn "fetch(" test/acceptance` → only `support/http-client.ts`
- [ ] `grep -rnE "\bexpect\(|import \{[^}]*\bexpect\b" test/acceptance` → only `drivers/assertions.ts`
- [ ] `grep -rn "\.\(get\|post\|put\|patch\|del\)(" test/acceptance/dsl` → nothing but `Map.get`
- [ ] `grep -rn "^import\|require(" test/acceptance/specs` → the DSL entry and `vitest` (`describe`, `it`, `afterEach`) only
- [ ] `grep -rn "src/" test/acceptance` → nothing
- [ ] `grep -rn "DocumentsCurrentBehavior" test/acceptance` → every pinned test, all in `specs/`

### Docs

- [ ] `test/acceptance/README.md`:
  - the four rules
  - how to run, including Phase 0's prerequisites
  - how to add a test
  - the known-wrong table (each pin and what it should be)
  - leftover-cleanup SQL by prefix and year range
  - orphan-check SQL for `planting_status_history`, `planting_planting_years`,
    `plants_activity_schedules` and `harvests` rows whose owner is gone
- [ ] Changelogs are kept up as each commit lands, following the feature-changelog skill:
  - test work goes in `2026-02-21-1-testing.md`, which starts with the original jest commit
    (`831accf`);
  - the delete APIs go in a file of their own, created in Phase 2.
  Check that both record the decisions above and the verification counts.

### Final verification

- [ ] Both services running; `npm run test:acceptance` is green.
- [ ] Run it twice more back to back: no collisions, and the residue check passes each time.
- [ ] The orphan SQL returns 0 for every table.
- [ ] `npm run build` and `npm run tsc:acceptance` are clean.

---

## Phase 6: Upgrade to vitest 5 and Node 24

Requested by the user on 2026-10-29, when vitest 5 turned out to need a newer Node than the
project targets (see Phase 1). It's the final step, so the suite is complete and green before
the runtime moves under it.

- [ ] Bump `@types/node` to `^24`.
- [ ] Move both `Dockerfile` stages from `node:20-alpine` to `node:24-alpine` (T-7). Node 20
  reached end of life in April 2026.
- [ ] `npm install --save-dev vitest@^5`. Check the vitest 5 migration notes against the suite's
  config: `globalSetup`'s `teardown`, `fileParallelism`, reporters.
- [ ] Build the Docker image, and run it once against the local database. Confirm the service
  starts, migrations run, and `GET /service-info` answers.
- [ ] `npm run build`, `npm run tsc:acceptance` and the full `npm run test:acceptance` are green,
  with the same counts as at the end of Phase 5.
- [ ] Note in the changelog that feral is still on vitest 1.6, in case the two suites drift.
- [ ] Delete this file once the changelogs hold the history.

---

## Appendix A: Review findings (2026-10-29)

From a read-only review of the service at `a3c0ed2`. The ids are referenced from Phase 4. The
**Suite** column says how the suite will record each one. **Out of scope** means it's worth
fixing, but not part of this plan.

### Security

| Id | Finding | Where | Suite |
|---|---|---|---|
| S-1 | `.env` is tracked in git (it's in `.dockerignore` but not `.gitignore`) and holds the DB passwords. Remove it from the index, add `.env.example`, rotate the passwords. | `.env`, `.gitignore` | out of scope |
| S-2 | An RSA **private key** is committed in the feral_auth seed script. It matches the commented-out "laptop" `SESSION_PUBLIC_KEY` in `.env`, so anyone with the repo can mint tokens for any environment that trusts that key. | `scripts/seed feral_auth db for testing.sql` | out of scope |
| S-3 | Authentication but no authorization. `request.actor` is attached and never read; there's no role or scope check, and data isn't scoped per user. | `src/routes/api-router.ts`, `src/middleware/attach-actor.ts` | noted in README |
| S-4 | Error responses leak internals. `error-handler.ts` returns `toObject()`, including the cause chain, SQL and `debugParams` (request bodies), in every environment. Errors are only *logged* in dev, so production failures leave no trace. | `src/middleware/error-handler.ts` | out of scope |
| S-5 | Body values are never type-checked before `conn.query`. mysql2 expands an object value to `` `k` = v ``, the classic object-injection widening. For example, an object in `unassign` reaches `DELETE ... AND activity_schedule_id = ?`. `multipleStatements: true` and an RW user with DDL and SUPER on `*.*` raise the stakes. All SQL otherwise uses placeholders. | `src/services/plants/queries.ts`, `src/database/config.ts`, `scripts/init-test-db-users.sql` | out of scope |
| S-6 | CORS allows any origin. | `src/app.ts` | out of scope |

### Wrong status codes

| Id | Finding | Where | Suite |
|---|---|---|---|
| S-B1 | A bad, forged or expired token → **500**, not 401. The `try` in `verify()` wraps only the Promise constructor, so the rejection never becomes `JwtVerifyError`, and `attach-actor` maps it to "Unknown error authenticating token". | `src/jwt/index.ts` `verify()`, `src/middleware/attach-actor.ts` | pinned (auth) |
| S-B2 | No `return` after `next(err)` when the token is missing or not a string, so `next` is called twice. The 401 is sent, then the error handler runs again on a finished response. | `src/middleware/attach-actor.ts` | the 401 test; watch for flakiness |
| S-NF | `RowNotFoundError` has status 500, so every not-found is a 500: plant, plot, planting, year, schedule, item, planning year. | `src/database/index.ts:61` | pinned |
| S-rewrap | Services rewrap every error in `new FeralError(...)`, which resets the status to 500. A disallowed planting update field (`PlantingValidationError`, 400) and `SplitActionOverflowError` come out as 500. The same flattening fed feral's first pinned-behaviour fixes. | `plantings-service.ts`, `split-action.ts` | pinned |
| B-dup | Duplicate category, subcategory, planting year or schedule link → 500. | services | pinned |
| S-NaN | `parseInt` never throws, so non-numeric path or query numbers reach SQL as `NaN` → 500. The guard in `planning-handlers.ts` is dead code. | handlers | pinned |
| S-body | Missing required body fields → 500: no `harvests` array (TypeError in the serializer), no `entryDate` (`format(Invalid Date)`), no planting `name` (NOT NULL). | serializers | pinned (a few) |
| S-shape | Error bodies are inconsistent: plant handlers send `{message}`, everything else sends `{errors:[...]}`. Malformed JSON gets Express's HTML 400 page. | handlers, `app.ts` | drivers tolerate both |

### Bugs

| Id | Finding | Where | Suite |
|---|---|---|---|
| B-year | Harvest upserts never write `planting_year`, so it takes the column default: the current calendar year. Summary, search and stats all filter on it. | `src/services/harvests/queries.ts` upsert | pinned |
| B-details | `getStatusBreakdowns` selects `current_planting_year`, but the row mapper reads `planting_year`, so `GET /planting-years` `details` counts are always 0. | `plantings/queries.ts` vs `plantings/row-mapper.ts` | pinned |
| B-overwrite | Upsert on a taken `friendly_name` silently updates the *other* plot or plant (`ON DUPLICATE KEY` fires on the unique name). For plots, the response holds an id that doesn't exist. | `plots-mysql-datasource.ts`, `plants-mysql-datasource.ts` | pinned |
| B-orphan | A plant with an unknown `subcategoryId` is inserted, then the read-back inner join fails → 500. The row stays and holds the name. Schedule assignment for an unknown plant behaves the same way. | plants datasource | pinned; driver cleans up |
| B-plot | Plot `isActive` is always true, a PUT echoes the input rather than the stored row, and a GET returns `is_active` as `1`. | `serializers/plots.ts`, `plots-service.ts` | pinned |
| B-name | `getPlantByFriendlyName` reads `results[0]!.plantId`, but the row has `plant_id`. | `plants-mysql-datasource.ts` | confirm; pin if reachable |
| B-split | `splitPlanting` picks its column list from `sourceCount` but always passes 3 params, so they mismatch when the count is 0. The PLANT action's split and update aren't in one transaction. | `plantings-mysql-datasource.ts`, `plant-action.ts` | pin if reachable |
| B-clear | `buildUpdateQuery` checks truthiness, so a field can't be cleared or set to 0. | `plantings/queries.ts` | pinned (one case) |
| B-item | Schedule-item PATCH ignores `:activityScheduleId` in the path. | `schedules/queries.ts` | pinned |
| B9 | No connection pool: every query opens a connection. `execTransactionQuery` leaks its connection if `beginTransaction` fails. | `src/database/index.ts` | fix in Phase 2 if cheap |
| B10 | `src/types/express/index.d.ts` imports a path that doesn't exist. `apiRouter` is a module-level singleton, so calling `buildRouter()` twice registers every route twice. | | out of scope |
| B11 | `scripts/init-test-db-users.sql` passwords don't match `.env`. The vigilant seed script is stale: it omits `tags` (TEXT NOT NULL) and leaves `subcategory_id=0`. | `scripts/` | out of scope (the suite doesn't use the seed) |

The `try-decorator` middleware is redundant under Express 5, which catches async errors itself.
Several handlers send a 400 without `return` and fall through. It's unreachable today but a
latent double-send.

---

## Appendix B: Data the API can and can't remove today

| Table | Written by | Deletable today | After Phase 2 |
|---|---|---|---|
| plant_categories | `POST /plant-categories` | no | `DELETE /plant-categories/:id` (409 if it has subcategories) |
| plant_subcategories | `POST /plant-categories/:id/plant-subcategories` | no | `DELETE .../plant-subcategories/:id` (409 if plants use it) |
| plants | `PUT /plants` | yes, orphans plantings and links | 409 if plantings; links removed with it |
| plants_activity_schedules | `PUT /plants/:id/activity-schedules` | `unassign` only | also removed with either side |
| plots | `PUT /plots` | yes, orphans `plot_id` | 409 if plantings use it |
| planting_years | `PUT /planting-years` | no | `DELETE /planting-years/:year` (409 if referenced) |
| plantings | `POST /plantings`, SPLIT | yes, orphans everything below | 409 if harvests; history and mappings removed with it |
| planting_status_history | every planting action and update | no (internal) | removed with its planting |
| planting_planting_years | create, year carry-over, SPLIT | no (internal) | removed with its planting |
| harvests | `PUT /harvests` | yes | unchanged |
| garden_journal | `PUT /journal` | no | `DELETE /journal/entries/:entryId` |
| garden_activity_log | `PUT /activity-log` | no | `DELETE /activity-log/entries/:entryId` |
| activity_schedules | `POST /activity-schedules` | no | `DELETE /activity-schedules/:id` |
| activity_schedule_items | `POST .../schedule-items` | yes | also cascaded by FK with its schedule |
| harvest_types | seed only | n/a | read-only to the suite |

---

## Appendix C: Review of the existing test setup (2026-10-29)

Reviewed at `a3c0ed2`, and compared with `../feral-authentication-service/test/` and
`../recipes-service/spec/`. **Plan** says where each finding is handled. **Out of scope** means
worth fixing, but not part of this plan.

| Id | Finding | Where | Plan |
|---|---|---|---|
| T-1 | `tsc` compiles tests and test config into the build output. `dist/` holds `test/` and `jest.config.js`, because the root `tsconfig.json` has no `include` or `exclude`. Feral excludes `test`. | `tsconfig.json` | Phase 1: exclude `test` |
| T-2 | `test/setup.ts` is both a jest `setupFiles` entry and imported by the test, so it runs twice. With the module-level `apiRouter` singleton (B10), a second app instance would register every route twice. | `jest.config.ts`, `test/setup.ts` | Phase 1: deleted |
| T-3 | The setup loads the real dev `.env` (DB credentials, session key) into the test process. `getApp(__dirname, '8102')` passes an `appRoot` that `getApp` never uses, and a port nothing listens on. | `test/setup.ts`, `src/app.ts` | Phase 1: deleted. The unused `appRoot` parameter is out of scope. |
| T-4 | The one test only checks `/service-info`. It never touches the DB, auth or a real route, so it guards almost nothing, and the acceptance suite covers the same check against the real service. | `test/service-info.test.ts` | Phase 1: deleted (user decision) |
| T-5 | Script names are out of step: `test:int` here, `test:integration` and `test:acceptance` in the sibling projects. | `package.json` | Phase 1 removes `test:int`; Phase 3 adds `test:acceptance` and `:watch` |
| T-6 | A 30s `testTimeout` is far more than an in-process call needs, and would hide a hang. | `jest.config.ts` | Phase 1: deleted. Acceptance uses feral's 15s test and 20s hook timeouts. |
| T-7 | The Docker image builds on `node:20-alpine`. Node 20 reached end of life in April 2026, and vitest 5 declares `node ^22.12 \|\| ^24 \|\| >=26`. The Docker build's `npm install` includes devDependencies (needed for `npm run build`), so it warns `EBADENGINE`, though it won't fail unless `engine-strict` is set. | `Dockerfile` | Phase 1, optional: `node:24-alpine` in both stages |
| T-8 | `tools/copy-assets.ts` copies `.env` into `dist/`. The server runs from the repo root, and `dotenv.config()` reads `./.env` from the cwd, so the copy isn't needed, and it puts secrets in the build output. In Docker the copy fails quietly, because `.dockerignore` excludes `.env`. Feral has the same line. | `tools/copy-assets.ts` | out of scope; pairs with S-1, in both projects |
| T-9 | Nothing runs tests automatically: `prepush` only lints. That's reasonable while the only suite needs running services. | `package.json` | note only |
| T-10 | Excluding `test/` from the root tsconfig would break lint. `eslint . --ext .ts` parses with `parserOptions.project: ./tsconfig.json`, and a file outside that project fails to parse. Feral handles this with `test/.eslintrc`, which points the parser at `test/acceptance/tsconfig.json`. | `.eslintrc` | Phase 1: add `test/.eslintrc` |

---

## Progress log

Newest last. One line per meaningful step: what was done, what changed in the plan, and the test
counts once there are any.

- **2026-10-29**: Reviewed the service and planned the suite. Decisions 1–3 agreed (tokens via
  feral login, 409 on deletes with children, API residue check). No code written.
- **2026-10-29**: Added Phase 1, a jest → vitest migration, so the acceptance suite can use
  feral's runner and port its files almost as-is. Decision 4 now reads vitest, and the later
  phases are renumbered 2–5. No code written.
- **2026-10-29**: Reviewed the existing test setup (Appendix C). On the user's decision, Phase 1
  now deletes the in-process service-info test, along with jest, ts-jest and supertest, rather
  than migrating it. Phase 1 also gives `test/` feral's shape: excluded from the root tsconfig,
  `test/.eslintrc`, and `test/acceptance/tsconfig.json`. Phase 3 gains a `tsc:acceptance`
  script. No code written.
- **2026-10-29**: Phase 1 done. jest, ts-jest, supertest and the in-process test are gone, and
  `test/` has feral's shape. **vitest 4, not 5:** vitest 5 needs Node 22.12+ and `@types/node`
  22+, so npm refused it. `@types/node` went from ^18 to ^20.19, matching the Docker image's
  Node 20. Phase 6 added for the vitest 5 / Node 24 upgrade, at the user's request. Changelog
  started: `2026-02-21-1-testing.md`, backfilled from `831accf`. Awaiting the user's review
  before commit.
- **2026-10-29**: Phase 1 committed as `6001d0e`. Phase 0 done:
  - `vigilant-test-gardener` created through feral's API and granted the Vigilant Harvest app
    (`82d7d287-...`);
  - its token verifies against this service's `SESSION_PUBLIC_KEY`;
  - the service answers as that user;
  - `test/acceptance/.env.acceptance` was written and gitignored.

  Found: about 955 leftover test applications in feral's local database.
- **2026-10-29**: Phase 0 committed as `54c5373`. Phase 2 done:
  - six new deletes; plantings, plants and plots refuse with 409 while in use; internal rows go
    in one transaction;
  - B9 fixed;
  - 50/50 smoke checks passed with no residue.

  Found: the TIMESTAMP date limit for 9xxx test years, 26 pre-existing orphan rows, and no
  impact on the app. Awaiting review before commit.
