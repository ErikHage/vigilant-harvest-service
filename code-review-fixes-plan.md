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
- **Changelog:** a new entry, appended to the code-review doc.
- **Commits:** stop for review before each commit, with a suggested message. One commit per phase.

## Status

| Phase | Findings | State |
|---|---|---|
| 1 | H1 · flat error bodies | done |
| 2 | H2 · JSON 400 for malformed bodies, `NODE_ENV=production` | next |
| 3 | H3 · log every error in prod | — |
| 4 | M1 · keep causes in planting actions; M10 · drop `multipleStatements` | — |
| 5 | H4 · PLANT in one transaction | — |
| 6 | H5 · input validation, route by route | to plan when reached |

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

- [ ] Acceptance test: malformed JSON, with and without a token → a JSON 400, with no stack. Seen to
      fail.
- [ ] An app-level error handler in `app.ts`, after the router, that answers in the Phase 1 shape.
- [ ] `ENV NODE_ENV=production` in the `Dockerfile`'s final stage. Check that the image still starts
      and reports healthy.
- [ ] Changelog entry, then stop for commit review

## Phase 3 — H3: log every error

- [ ] The error handler logs every error with its full chain: `warn` for 4xx, `error` for 5xx, with the
      method and path.
- [ ] The try-decorator stops logging on its own, so no error is logged twice. Rename its logger (L5).
- [ ] Request-body logging stays dev-only.
- [ ] Seen in a production-mode run: a 500 and a 409 each leave one log line.
- [ ] Changelog entry, then stop for commit review

## Phase 4 — M1 and M10

- [ ] Each planting action's `catch` passes the cause. `harvests-service.ts:161` throws the wrapper.
- [ ] The pinned "splitting out as many as a planting holds answers 500" turns 400. Retire the pin.
- [ ] Remove `multipleStatements` from `database/config.ts`.
- [ ] Changelog entry, then stop for commit review

## Phase 5 — H4: PLANT in one transaction

- [ ] Acceptance test: PLANT into a plot that doesn't exist answers 400, and writes nothing. Seen to
      fail; it answers 500 and leaves a `(N Remaining)` planting today.
- [ ] The split, the update and the history row go into one `execTransactionQuery` list. Check the
      plot first.
- [ ] Changelog entry, then stop for commit review

## Phase 6 — H5: validation

Planned when Phase 5 is done. Expect a sub-phase per route group, each retiring its pinned rows.

## Progress log

- 2026-11-02: plan written. Phase 1 started.
- 2026-11-02: Phase 1 done. vigilant-harvest-app checked for dependence on the old error shape: none.
  Committed.
