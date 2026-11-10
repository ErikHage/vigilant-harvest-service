# Unit tests

Tests of pure code in `src/`, run in-process. Unlike the acceptance suite, a unit spec imports what
it tests from `src/` directly; there is no DSL layer, and assertions sit in the spec.

```sh
npm run test:unit
npm run tsc:unit     # type-checks the specs
```

Add a spec next to the path of what it tests: `src/util/local-dates.ts` is tested by
`test/unit/util/local-dates.spec.ts`. Table-driven `it.each` is preferred where the cases are data.
