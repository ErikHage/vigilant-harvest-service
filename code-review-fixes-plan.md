# Code review fixes — plan and progress

Works through the ranked findings in
`ai-changelogs/projects/vigilant-harvest-service/2026-11-02-2-code-review.md` (`65e8dea`), in its
suggested order. IDs (H1, M1, …) are that doc's. Delete this file when the plan is done; the changelog
keeps the history.

## Rules for every phase

- **Acceptance test first:** a test for the fix, through the DSL and a driver, seen to fail before the
  fix and to pass after it.
- **Then the full suite:** 112 passing at the start, more as tests are added, and no residue.
- **Pinned behaviour:** where a fix changes it, the pinned test goes red. Rename the driver method,
  update the DSL line, delete the marker, and remove its row from the README table.
- **Run the service as a built server, not through nodemon:** `npm run build`, then
  `node dist/src/server.js`, restarted by hand after each change. On Windows, nodemon's restart can
  leave the old server holding port 8002, and the new one dies with "already in use". Before trusting a
  run, check that the listener started after `dist` was written.
- **Changelog:** a new entry, appended to the code-review doc.
- **Commits:** stop for review before each commit, with a suggested message. One commit per phase.

## Status

| Phase | Findings | State |
|---|---|---|
| 1 | H1 · flat error bodies | done |
| 2 | H2 · JSON 400 for malformed bodies, `NODE_ENV=production` | done |
| 3 | H3 · log every error in prod | done |
| 4 | M1 · keep causes in planting actions; M10 · drop `multipleStatements` | done |
| 5 | H4 · PLANT in one transaction | done |
| 6 | H5 · input validation, route by route | 6a–6e done; 6f next |

## Phase 1 — H1: one flat error per body

**Decided (user, 2026-11-02):** `{ errors: [ { name, message, status } ] }`.
- For a 4xx, `name` and `message` come from the deepest error in the `feralCause` chain that carries
  the same status, which is the one that set it. Examples: `Planting has harvests`; `Error performing
  query: duplicate entry`.
- For a 5xx, they come from the top-level error. No `cause`, and no `debugParams`.
- The full chain is still available to logging; Phase 3 logs it.
- **The app is unaffected:** it reads `errors[0].message` on a 400 (`harvest-utils.js`) and the status
  on a 401.

- [x] Acceptance check: error bodies carry no `cause` or `debugParams`. It went into `expectStatus`
      for every error status, rather than one new test, so all 52 error-path tests guard it. Seen to
      fail: 52 failed and 60 passed.
- [x] `FeralError`: a method returning the public view (`toResponse()`), beside `toObject()`, which
      logging keeps using.
- [x] `middleware/error-handler.ts` sends it.
- [x] Every 409 and 400 reason the drivers assert is still in the body. The suite is green: 112 passed.
- [x] Changelog entry
- [x] Checked vigilant-harvest-app before committing: nothing reads `cause` or `debugParams`, and every
      400 it shows keeps its text
- [x] Stop for commit review

## Phase 2 — H2: malformed bodies answer JSON

- [x] Acceptance test: malformed JSON, with and without a token → a JSON 400, with no stack. Seen to
      fail: both got Express's HTML 400. The suite's client gained `putRaw`.
- [x] An app-level error handler in `app.ts`, after the router, that answers in the Phase 1 shape. It's
      the same handler, which now keeps a body parser's own 4xx status (`expose` + `status`).
- [x] `ENV NODE_ENV=production` in the `Dockerfile`'s final stage. Checked: db-migrate doesn't read it.
      The image ran against an empty MySQL 8.0.42 database: 28 migrations, healthy at ~36 s,
      `docker stop` in 596 ms with exit 0.
- [x] Suite: 114 passed (112 + 2).
- [x] Changelog entry
- [x] Stop for commit review

## Phase 3 — H3: log every error

- [x] The error handler logs every error with its full chain: `warn` for 4xx, and `error` with the
      stack for 5xx, with the method and path.
- [x] The try-decorator stops logging, and its misnamed logger is gone (L5). So do the other 11
      log-and-rethrow sites: `database/index.ts` (2), `jwt/index.ts` verify, `attach-actor.ts` (2), and
      the harvest services (7). A rollback failure still logs, as a separate error.
- [x] `UnauthorizedError` takes a cause, so a 401's line says why the token was rejected.
- [x] `toObject()` also follows a standard `cause`, so the line reaches MySQL's own message.
- [x] Request-body logging stays dev-only.
- [x] Seen in a production-mode run: 2 × 401, 400, 404, 409 and 500 each left exactly one line.
- [x] Suite: 114 passed.
- [x] Changelog entry
- [x] Stop for commit review

## Phase 4 — M1 and M10

- [x] Each planting action's `catch` passes the cause. That's six actions; START was missing from the
      review's list. (`harvests-service.ts:161` already throws the wrapper; that went in with Phase 3,
      since its log line was removed there.)
- [x] The pinned "splitting out as many as a planting holds answers 500" turns 400. It also needed
      `SplitActionOverflowError` to set status 400. Pin retired: 19 left.
- [x] Remove `multipleStatements` from `database/config.ts`.
- [x] Suite: 114 passed, against a freshly started build. This also covers Phase 3's final code (see the
      log).
- [x] Changelog entry
- [x] Stop for commit review

## Phase 5 — H4: PLANT in one transaction

- [x] Acceptance test: PLANT into a plot that doesn't exist answers 400, and writes nothing. Seen to
      fail: after Phase 4 it already answered 400 (the foreign key's), but it left
      `acc-row-one-…(6 Remaining)`. The driver registers whatever is in the year before it asserts,
      so the stray split was cleaned up.
- [x] The split, the update and the history row go into one `execTransactionQuery` list
      (`plantPlanting`, built from `_buildSplitQueries`, which `splitPlanting` now uses too). The plot
      is checked first: `Unknown plot id: …`.
- [x] Suite: 115 passed, against a build whose listener started after `dist` was written.
- [x] Changelog entry
- [x] Stop for commit review

## Phase 6 — H5: validation

**Decided (user, 2026-11-02):**
- **A small hand-written module, not zod.** `src/validation/`, with a few helpers that throw
  `BadRequestError` naming the field. It matches the existing `parseHarvestTypeId`
  (`serializers/harvests.ts`) style, and adds no dependency.
- **Numeric strings are accepted.** A number field takes `2026` or `"2026"` and stores the number.
  Anything else is a 400: `"abc"`, `""`, a fraction where an integer is needed, a missing required
  field.
  - The app restores `plantingYear` from `localStorage`, so it may send a string.
  - Most of its forms use `v-model.number`, in 36 places, but not all of them.

**Pins this retires (10 of the 19 left).** The other 9 aren't validation, and stay for later:
name-collision overwrites, response shapes, PATCH semantics, schedule-item ownership.

| Sub-phase | Pins |
|---|---|
| 6a | plantings `?plantingYear=abc`; harvests search with no year; planning `/abc`; journal `/abc`; activity log `/abc` |
| 6b | journal entry with no date; activity-log entry with no date |
| 6c | harvests saved with no list |
| 6d | planting created with no name |
| 6e | plant schedule assignment with no lists |

### Every sub-phase

1. **Survey the app first.** For each route in the group, find exactly what vigilant-harvest-app sends:
   - field types;
   - strings from `localStorage` or from forms without `.number`;
   - `''` or `null` for blanks;
   - date formats;
   - extra fields.

   Record it in the sub-phase's notes. **Nothing the app sends may become a 400.** Where it sends
   something odd, accept it, and note it as an app fix.
2. **Tests first.** For each route, table-driven, through the existing DSL modules: a missing required
   field, a wrong type, an unparseable date, and an over-long string → 400 naming the field. Add one
   "accepted as the app sends it" case for each oddity the survey found. Seen to fail.
3. **Validate in the serializer** (`serializers/*.ts`), so handlers and services get typed, checked
   values. The pins go red; retire them as before.
4. **Suite green,** against a server started after the build. Lint and both type-checks clean.
5. Changelog entry, then stop for commit review. One commit per sub-phase.

### The module (built in 6a, grown as needed)

`src/validation/index.ts`, with helpers that each take `(body or params, field)` and return the
checked value:
- `requiredString`, `optionalString` (both with `maxLength`; 255 for `VARCHAR(255)` columns, none for
  `TEXT`);
- `requiredInteger`, `optionalInteger` (numeric strings accepted; with `min`);
- `requiredNumber` (for quantities);
- `requiredDate`, `optionalDate` (a `YYYY-MM-DD` or an ISO timestamp; anything `Date` can't parse is a
  400);
- `requiredList`;
- `oneOf`.

Each throws `BadRequestError('<field> must be …')`. Column sizes come from `migrations/sqls/*-up.sql`.

### Sub-phases

- [x] **6a · years in paths and queries.** Done. Notes:
  - **The app survey:**
    - The store's `plantingYear` is a string (`localStorage`, or `Object.keys` in the year picker),
      or a number only when it defaults to the current year.
    - The year-details page passes its route param, a string.
    - After the dashboard clears the year, a page can call with `null` (`/journal/null`): a 400 now,
      a 500 before, and the app's alert either way.
    - A cleared year is left out of `?plantingYear` by axios, so `GET /plantings` lists every year,
      as before. `""` is never sent, because the storage helper turns it into `null`.
  - **Seen to fail:** 7 tests, the 5 renamed pins and 2 new ones (`GET /planting-years/abc`; search,
    summary and stats with `abc`). Then 117 passed, and 14 pins are left.
  - **The module so far:** `requiredInteger`, `optionalInteger`, `requiredYear` (min 1). `DELETE
    /planting-years/:year`'s own NaN check went, because the serializer now rejects it first.
  - The module, with `requiredInteger` first.
  - `/journal/:plantingYear`, `/activity-log/:plantingYear`, `/planning/:plantingYear`,
    `/planting-years/:plantingYear`, `/plantings?plantingYear`, `/harvests/summary?plantingYear`, and
    `/harvests/search` and `/harvests/stats` `?year`.
  - Drop the dead `try`/`catch` around `parseInt` in `planning-handlers.ts` (L3).
  - Retires 5 pins.
- [x] **6b · journal and activity-log bodies.** Done. Notes:
  - **The app survey:** both dialogs send `entryDate` as `dayjs().toISOString()`, and the page adds the
    store's `plantingYear`, which may be a string. The journal's `entry` and the log's `comments` are
    `''` when left empty. The log's `subType` is `null` when not picked. The app never sends `entryId`.
    All of these are accepted.
  - **App fix:** with no activity type picked, the log dialog throws on `this.activityType.name`
    before it sends anything.
  - **Seen to fail:** 17 table cases (15 answered 500; text or comments sent as `42` were stored as
    `"42"`, 201). Then 2 more for a date out of `TIMESTAMP` range, found by a probe (500, `Incorrect
    datetime value`). The 2 app-shaped cases passed before and after.
  - **The module grew:** `requiredString` (blank is missing), `optionalString` (`''` is kept), with
    `maxLength` in characters or `maxBytes`; `requiredTimestamp` (`YYYY-MM-DD` or ISO 8601, years
    1971–2037); `bodyOf` (no body reads as `{}`); `TEXT_BYTES`.
  - `entry`, `subType` and `comments` are nullable, as in the schema; a missing one is stored `NULL`.
  - Retired 2 pins, folded into each route's table as its `no date` case. 12 are left. 136 passed.
- [x] **6c · harvests.** Done. Notes:
  - **The app survey:** both pages send `quantity` from `v-model.number` boxes, so a number, and fractions
    are possible: the harvest types include pounds, ounces and kilograms. The garden page skips
    quantities of 0 or less; the edit dialog doesn't, and a cleared box sends `''`. `harvestDate` is a JS
    `Date` sent as JSON, or the date the service returned, so always an ISO timestamp. `harvestTypeId` is
    a number from a select. The store adds `plantingYear`, which the service ignores.
  - **Decided:** a fraction is accepted, as today, though the INT column rounds it (1.5 → 2, 0.4 → 0,
    checked). Rejecting it would block real weights. The column type is a separate finding. A blank, zero
    or negative quantity from the edit dialog is now a 400, which the dialog shows, staying open.
  - **L7 fixed:** a bare `YYYY-MM-DD` is now that day in the service's zone, in the shared date check, so
    journal and log dates sent that way are fixed too. Nothing sends one: the app sends timestamps, and
    the suite noon. A test saves a bare date and a noon one on the same day, and they fold into one.
  - **The module grew:** `requiredNumber` (`greaterThan`, `max`), `requiredList`, `requiredObject`,
    `INT_MAX`; a bare date that doesn't exist (`2026-02-30`) is rejected. `parseHarvestTypeId` went.
  - **Seen to fail:** 15 (10 answered 500; zero and negative saved with 201; 3 answered 400 with other
    messages; the bare date was filed a day early). Then 151 passed. 11 pins are left.
- [x] **6d · plantings.** Done. Notes:
  - **The app survey:** every date is an ISO timestamp (pickers, or the date the service returned).
    Counts and the lead time come from `v-model.number` boxes, so a cleared one sends `''`; the dialogs
    start counts at 0. Untouched strings and comments are `null`. The add and split dialogs start names
    as `''`. The store adds the year, possibly a string.
  - **A live app bug, fixed:** creating a planting with the lead time box typed in and then cleared
    sent `''`, which the INT column rejects (1366, checked): a 500. `''` is now "not given".
  - **Decided:** `''` is "not given" for optional numbers and dates (`blankAsMissing`), and for every
    update field, because an update skips empty values (a pin, unchanged). A blank name, on create or in
    a split, is a 400. Counts may be 0, the dialogs' default. A COMMENT with no comment now stores `''`,
    as the other actions already did.
  - **The module grew:** `oneOf`, `blankAsMissing`, `requiredDate`/`optionalDate` for DATE columns
    (years 1000–9999), and `max` on integers.
  - **Seen to fail:** 27. 16 answered 500, including the app-shaped create; 6 succeeded (3 creates, 2
    updates, and a COMMENT of `42`); 5 answered 400 for other reasons. Then 179 passed. 10 pins are left.
- [x] **6e · plants, categories, subcategories, schedule assignment.** Done.
  Notes:
  - **The app survey:** the add dialog sends a subcategory id, name, `lifespanType` (`null` until
    picked), `description` (`''`) and a harvest type. The edit page sends every section, trimmed:
    sowing `indoor`/`direct` are free-text boxes, numbers are `v-model.number` (`''` when cleared),
    `isClimbing` a checkbox boolean, and an extra `seedSource`. Schedule assignment sends both lists.
    Categories send a trimmed name.
  - **A live app bug, fixed:** a cleared number box on the plant edit page sent `''`, which the INT and
    DECIMAL columns reject (1366, checked): every such save was a 500.
  - **Decided (user):** `PUT /plants` errors use the standard body. The app's plant store reads
    `err.data?.message`, so it shows its generic alert for these until it reads `errors[0].message`
    (an app fix).
  - **Decided:** `lifespanType` is one of the app's four, any case (the local data holds two of them).
    The sowing boxes take a string or a boolean, the boolean stored as "1"/"0", as MySQL did (the pin
    stays). Both assignment lists are required.
  - **The module grew:** `optionalNumber` (with `min`), `optionalBoolean`, `optionalList`,
    `optionalObject`. The category-id `parseInt`s went.
  - **Seen to fail:** 26 (16 answered 500, 7 saved with 201, 3 answered 400 another way). Then 205
    passed. 9 pins are left.
- [ ] **6f · plots, planting years, schedules and schedule items.** No pins. Covers the remaining write
  routes.

### Not in Phase 6

- The 9 other pins.
- M3's other error shapes, and the JSON 404 catch-all.
- M2 (harvest folding).
- START and RETIRE atomicity.

Each can be planned after Phase 6.

## Progress log

- 2026-11-02: plan written. Phase 1 started.
- 2026-11-02: Phase 1 done. vigilant-harvest-app checked for dependence on the old error shape: none.
  Committed.
- 2026-11-02: Phase 2 done and committed. Along the way, a nested ternary in the suite's
  client failed lint, which `npm run build` runs over test files too, and stopped the dev server.
- 2026-11-02: Phase 3 done and committed.
- 2026-11-02: Phase 4. The first suite run passed with the pinned split test still green, which was
  wrong. The orphaned nodemon server from 17:09 was still serving, and every rebuild since had died
  with "Port 8002 is already in use". That includes the last Phase 3 build, so the Phase 3 suite run
  may have tested a mid-edit build. The Phase 3 logging itself was verified on port 8013 from the final
  build. After a fresh start, exactly the split pin failed. It is retired, and 114 passed. Phase 4 is
  done and committed.
- 2026-11-02: Phase 5 done and committed. Phase 6 (H5) needs its own plan first.
- 2026-11-02: Phase 6 planned: a hand-written module, numeric strings accepted (user). Six sub-phases,
  retiring 10 pins. Waiting for approval before 6a.
- 2026-11-02: 6a done and committed; starting 6b.
- 2026-11-02: 6b done and committed. A probe found dates outside `TIMESTAMP`'s range answer
  500; checked here too.
- 2026-11-02: 6c done and committed. L7 fixed with it, since nothing depended on it.
- 2026-11-02: 6d done and committed. Found and fixed a live 500 in the app's create form.
- 2026-11-02: 6e done and committed. User chose the standard error body for PUT /plants.
