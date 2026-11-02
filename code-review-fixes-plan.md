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
| 6 | H5 · input validation, route by route | planning |

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

Planned when Phase 5 is done. Expect a sub-phase per route group, each retiring its pinned rows.

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
