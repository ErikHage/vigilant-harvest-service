# API changes: harvest types

Changes to `vigilant-harvest-service` that the UI needs to pick up. Base URL is unchanged:
`/api/vigilant-harvest-service/v0`. Auth is unchanged — every route below still requires the
`x-feral-auth-token` header.

A **harvest type** describes what a harvest's `quantity` counts. Depending on the plant that's
either a unit of measure (`pounds`, `pints`, `bunches`) or the part of the plant picked (`fruit`,
`leaf`, `root`). Types come from a fixed, server-seeded list.

## ⚠️ Three breaking changes to handle first

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

**3. `PUT /harvests` may now return a *new* harvest where it used to return the existing one.**
Submitting a harvest with no `harvestId` still merges into that planting's harvest for the same day
— but only when that harvest was recorded under the plant's **current** default type. If the plant's
default has changed since, nothing is merged: a second harvest is created for that planting and day,
carrying the new type, and the response comes back with a **different `harvestId`** than the one
already on screen.

So one planting can hold two harvests on the same date, e.g. 8 `pounds` and 2 `count`. Any UI that
assumes one harvest per planting per day — a day cell keyed by `plantingId`, or code expecting the
response id to match the row it just submitted — needs the harvest type in that key, and needs to
render a day as a list rather than a single value. Take the `harvestId` from the response rather
than assuming it.

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

- A harvest's type is stamped **once, at creation**, from the plant's default, and is never
  rewritten afterwards.
- Updating a harvest by `harvestId` replaces its quantity and **keeps** its stored type.
- Submitting a harvest with no `harvestId` merges into the planting's same-day harvest **only when
  the types match**. When the plant's default has changed, a separate harvest is created instead —
  quantities of two different types are never summed together (see breaking change 3).
- Changing a plant's default **does not** rewrite existing harvests — historical harvests keep the
  type they were recorded under. This is intentional. So a "change this plant's units" action in
  the UI should not promise to update past harvests; word it as applying to future harvests.
- Because of the above, one planting legitimately holds harvests of more than one type — over the
  season, and even on a single day.

## Suggested UI work

1. Fetch `GET /harvest-types` once and cache it; back a dropdown with it.
2. Plant edit form: add the dropdown bound to `harvesting.defaultHarvestTypeId`, and make sure the
   save path always sends it (breaking change 2).
3. Plant display: show `harvesting.defaultHarvestType`.
4. Harvest lists: show `harvestType` next to `quantity` (e.g. "8 pounds"), and allow a
   planting to show more than one entry for a single day (breaking change 3).
5. Summary and stats views: re-key any grouping to include the harvest type, and label each row
   with its type (breaking change 1).
6. Harvest entry form: no change — do not add a type picker, it isn't supported server-side yet.
