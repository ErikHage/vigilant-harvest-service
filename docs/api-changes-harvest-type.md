# API changes: harvest types

Changes to `vigilant-harvest-service` that the UI needs to pick up. Base URL is unchanged:
`/api/vigilant-harvest-service/v0`. Auth is unchanged — every route below still requires the
`x-feral-auth-token` header.

A **harvest type** describes what a harvest's `quantity` counts. Depending on the plant that's
either a unit of measure (`pounds`, `pints`, `bunches`) or the part of the plant picked (`fruit`,
`leaf`, `root`). Types come from a fixed, server-seeded list.

## How to read this doc

This doc is **append-only**. Everything from here to the changelog is the contract as first written,
on 2026-08-29. Later changes are recorded in [Changelog](#changelog) at the bottom instead of being
edited in above, so that a reader who has already worked through the body can pick up just the
differences.

Read the changelog. Passages the changelog supersedes are marked `⚠️ Superseded` where they appear,
and each entry lists exactly what it replaces.

## ⚠️ Two breaking changes to handle first

> ⚠️ **Superseded** — revisions 2 and 3 add a third breaking change, and revise it.

**1. `/harvests/summary` and `/harvests/stats` can now return more rows than before.**
Both used to return one row per planting (or per plant). They now return one row per
**planting × harvest type** (or **plant × harvest type**). A planting whose plant's default type
changed mid-season yields two rows — same `plantingId`, different `harvestType`.

Any UI code doing `new Map(rows.map(r => [r.plantingId, r]))`, `groupBy(plantingId)`, or a
`.find(r => r.plantingId === id)` will now silently drop or overwrite data. Key on the pair
instead, e.g. `` `${plantingId}::${harvestTypeId}` ``, and render the type alongside the quantity.

**2. `PUT /plants` resets the harvest type if you omit the field.**
The request serializer defaults a missing `harvesting.defaultHarvestTypeId` to `1` (`unspecified`).
`PUT /plants` is a full upsert, so an existing plant-edit form that doesn't send the new field will
wipe that plant's harvest type on every save. Always send `harvesting.defaultHarvestTypeId` —
populate it from the plant you loaded.

## New endpoint: `GET /harvest-types`

Read-only. Returns the full seeded list, sorted by name. Use it to populate the plant-edit dropdown.

```json
[
  { "harvestTypeId": 14, "harvestTypeName": "bulb" },
  { "harvestTypeId": 9,  "harvestTypeName": "bunches" },
  { "harvestTypeId": 2,  "harvestTypeName": "count" },
  { "harvestTypeId": 16, "harvestTypeName": "flower" },
  { "harvestTypeId": 11, "harvestTypeName": "fruit" },
  { "harvestTypeId": 5,  "harvestTypeName": "grams" },
  { "harvestTypeId": 10, "harvestTypeName": "heads" },
  { "harvestTypeId": 6,  "harvestTypeName": "kilograms" },
  { "harvestTypeId": 12, "harvestTypeName": "leaf" },
  { "harvestTypeId": 3,  "harvestTypeName": "ounces" },
  { "harvestTypeId": 7,  "harvestTypeName": "pints" },
  { "harvestTypeId": 18, "harvestTypeName": "pod" },
  { "harvestTypeId": 4,  "harvestTypeName": "pounds" },
  { "harvestTypeId": 8,  "harvestTypeName": "quarts" },
  { "harvestTypeId": 13, "harvestTypeName": "root" },
  { "harvestTypeId": 15, "harvestTypeName": "seed" },
  { "harvestTypeId": 17, "harvestTypeName": "stem" },
  { "harvestTypeId": 19, "harvestTypeName": "tuber" },
  { "harvestTypeId": 1,  "harvestTypeName": "unspecified" }
]
```

The list is fixed — there is no create/update/delete endpoint. Adding a type requires a server
migration. `unspecified` is always id `1` and is the fallback everywhere. Ids are stable; don't
hardcode them beyond `1`, fetch the list.

Note the field is `harvestTypeName` on **this** endpoint. On plants and harvests the name comes
back as `defaultHarvestType` / `harvestType`. That inconsistency is real — don't "fix" it in a
shared type.

## Plants

`harvesting` gains two fields, following the existing `subcategoryId` / `subcategory` convention —
send the id, read back the id and the name.

```ts
interface HarvestingInfo {
  defaultHarvestTypeId: number;   // send this on write; read on responses
  defaultHarvestType?: string;    // name, e.g. "pounds". Read-only — ignored on write
  fruitSize?: string;
  shelfStability?: string;
  harvestInstructions?: string;
}
```

Affects `GET /plants`, `GET /plants/:plantId`, `PUT /plants`, and
`PUT /plants/:plantId/activity-schedules` — every response carrying a plant.

- On responses `defaultHarvestType` is always populated.
- On requests only `defaultHarvestTypeId` is read; sending `defaultHarvestType` does nothing.
- New plants that omit the field get `1` / `"unspecified"`.
- Editing a plant's default is just `PUT /plants` — no separate endpoint.

Example response fragment:

```json
"harvesting": {
  "defaultHarvestTypeId": 4,
  "defaultHarvestType": "pounds",
  "fruitSize": "medium",
  "shelfStability": "1 week",
  "harvestInstructions": "Pick when firm"
}
```

## Harvests

### `PUT /harvests` — request is UNCHANGED

> ⚠️ **Superseded by revision 3** — the request now takes an optional `harvestTypeId`.
> Do not build against this section.

Do not send a harvest type. Each harvest inherits its plant's `defaultHarvestTypeId` at creation.
Per-harvest override is a planned future change; there is no way to set it today.

```json
{ "harvests": [ { "plantingId": "…", "quantity": 3, "harvestDate": "2026-08-28T00:00:00" } ] }
```

### Responses gain `harvestTypeId` + `harvestType`

Applies to `PUT /harvests` (201) and `GET /harvests/search?year=…` (200):

```json
{
  "harvestId": "…",
  "plantingId": "…",
  "quantity": 8,
  "harvestDate": "2026-08-28T04:00:00.000Z",
  "harvestTypeId": 4,
  "harvestType": "pounds"
}
```

### `GET /harvests/summary?plantingYear=…`

Gains `harvestTypeId` + `harvestType`, and **is now grouped by type** (see breaking change 1):

```json
[
  { "plantingYear": 2026, "plantingId": "00c67f79…", "quantity": 99, "harvestTypeId": 4, "harvestType": "pounds" },
  { "plantingYear": 2026, "plantingId": "00c67f79…", "quantity": 2,  "harvestTypeId": 2, "harvestType": "count" }
]
```

Same `plantingId` twice, different types. Never sum across rows with different `harvestTypeId` —
adding 99 pounds to 2 count is meaningless.

### `GET /harvests/stats?year=…&type=Planting|Plant`

Envelope is unchanged (`firstHarvestDate`, `lastHarvestDate`, `numberOfHarvests`, `numberOfDays`,
`statsType`, `stats`). Each entry in `stats` gains the two fields, and **entries are now split by
type** (see breaking change 1):

```ts
interface ItemStats {
  plantingId?: string;
  plantingName?: string;
  plantId: string;
  plantName: string;
  plotName?: string;
  harvestTypeId: number;   // NEW
  harvestType: string;     // NEW
  totalQuantity: number;
  averageHarvestPerDay: number;
  firstHarvest: string | null;
  lastHarvest: string | null;
}
```

`totalQuantity` and `averageHarvestPerDay` are per type. The top-level `numberOfHarvests`,
`numberOfDays`, and first/last dates still span the whole year across all types — those are
unchanged and are not per type.

## Behaviour the UI should reflect

> ⚠️ **Superseded by revisions 2 and 3** — the merge rule and the "stamped once" rule
> below have both changed. Read the changelog for the current rules.

- A harvest's type is stamped **once, at creation**, from the plant's default.
- Updating a harvest (by `harvestId`) or merging into a same-day harvest **never** changes its
  stored type.
- Changing a plant's default **does not** rewrite existing harvests — historical harvests keep the
  type they were recorded under. This is intentional. So a "change this plant's units" action in
  the UI should not promise to update past harvests; word it as applying to future harvests.
- Because of the above, one planting legitimately holds harvests of more than one type over time.

## Suggested UI work

> ⚠️ **Items 4 and 6 superseded** by revisions 2 and 3. Items 1, 2, 3 and 5 still stand.

1. Fetch `GET /harvest-types` once and cache it; back a dropdown with it.
2. Plant edit form: add the dropdown bound to `harvesting.defaultHarvestTypeId`, and make sure the
   save path always sends it (breaking change 2).
3. Plant display: show `harvesting.defaultHarvestType`.
4. Harvest lists: show `harvestType` next to `quantity` (e.g. "8 pounds").
5. Summary and stats views: re-key any grouping to include the harvest type, and label each row
   with its type (breaking change 1).
6. Harvest entry form: no change — do not add a type picker, it isn't supported server-side yet.

---

# Changelog

Newest last. Each entry is a change to the contract described above, made after that body was
written.

## Revision 2 — 2026-08-29 — same-day harvests are only merged within a type

**What changed.** `PUT /harvests` with no `harvestId` used to merge into *any* harvest that planting
already had on that date, adding the quantities and keeping whatever type that harvest was stored
with. So a plant whose default changed from `pounds` to `count` would turn a new 2-`count` harvest
into part of an existing 8-`pounds` one — 10 `pounds`, summing two quantities that don't share a
unit.

It now merges **only when the types match**. If the existing same-day harvest was recorded under a
different type, nothing is merged: a second harvest is created for that planting and date, carrying
the new type. The day then holds 8 `pounds` and 2 `count` as separate entries.

**New breaking change (numbered 3).** `PUT /harvests` may return a **different `harvestId`** than
the harvest already on screen, because it created a new one instead of merging. A planting can hold
more than one harvest on a single date.

Any UI that assumes one harvest per planting per day — a day cell keyed by `plantingId`, or code
expecting the response id to match the row it submitted — needs the harvest type in that key, and
needs to render a day as a list rather than a single value.

**Supersedes:**

- *Behaviour the UI should reflect* — the bullet reading "Updating a harvest (by `harvestId`) or
  merging into a same-day harvest **never** changes its stored type". Updating by `harvestId` still
  preserves the stored type; the same-day merge is what changed.
- *Suggested UI work* item 4 — harvest lists must now let one planting show more than one entry for
  a single day.

## Revision 3 — 2026-08-29 — harvest type can be set per harvest

**What changed.** The per-harvest override that the body describes as "a planned future change" is
now implemented, in both directions: setting a type when recording a harvest, and changing the type
of one that already exists.

### `PUT /harvests` takes an optional `harvestTypeId`

Each harvest in the array accepts it. Omit it and a new harvest inherits its plant's
`defaultHarvestTypeId`, while an existing one keeps the type it is already stored with. Send it and
it wins over both.

```json
{
  "harvests": [
    { "plantingId": "…", "quantity": 3, "harvestDate": "2026-08-28T00:00:00" },
    { "plantingId": "…", "quantity": 3, "harvestDate": "2026-08-28T00:00:00", "harvestTypeId": 9 },
    { "harvestId": "…", "plantingId": "…", "quantity": 3, "harvestDate": "2026-08-28T00:00:00",
      "harvestTypeId": 4 }
  ]
}
```

Those three are: inherit the plant default, create with an override, and retype an existing harvest.

An id that isn't in `GET /harvest-types` gets a `400`, as does a non-integer one, and nothing in the
request is written. The body is the standard error envelope:
`{ "errors": [ { "message": "Unknown harvest type id(s): 99999", … } ] }`.

### The rule that now governs all of this

**A planting holds at most one harvest per day per type.** Harvests that would collide on that
triple are folded into one and their quantities summed. Quantities of two *different* types are
never summed.

### Breaking change 3 is wider than revision 2 stated

`PUT /harvests` not returning the `harvestId` you sent now has a second cause. Retyping an existing
harvest onto a day that already holds one of the new type **absorbs it**: the quantities are
combined into that harvest, **the row you sent is deleted**, and the response carries the surviving
harvest's id.

```
Day already has:  A: 8 pounds   B: 2 count

PUT { harvestId: B, quantity: 2, harvestTypeId: <pounds> }

Result:           A: 10 pounds  (B is gone)
Response:         harvestId A   — not the id you sent
```

So a harvest the UI just edited may no longer exist. Reconcile against the ids in the response
rather than the ones you sent.

**Supersedes:**

- *Harvests → `PUT /harvests` — request is UNCHANGED* — the whole section. The request takes
  `harvestTypeId`, and there is no longer a reason to avoid a type picker.
- *Behaviour the UI should reflect* — the "stamped **once**, at creation" bullet. A harvest's type
  is now changeable for the life of the harvest.
- *Suggested UI work* item 6 ("do not add a type picker, it isn't supported server-side yet").

**Replaces suggested UI work item 6 with:**

6. Harvest entry form: add an optional type picker, defaulted to the plant's `defaultHarvestType`
   and backed by the same cached `GET /harvest-types` list. Leave `harvestTypeId` out of the
   request to accept that default.
7. Harvest edit: allow changing an existing harvest's type by sending `harvestId` +
   `harvestTypeId`, and handle the response coming back with a different id than you sent.
8. Handle a `400` from `PUT /harvests` for an unknown harvest type id. It shouldn't happen if the
   picker is backed by `GET /harvest-types`, but don't surface it as a generic failure.

**Unchanged by this revision:** everything about plants, `GET /harvest-types`, the response fields
on harvests, and the summary/stats grouping. Breaking changes 1 and 2 stand as written.
