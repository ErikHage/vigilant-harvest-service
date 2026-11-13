# vigilant-harvest-service

A collection of APIs for the vigilant-harvest-app

Plot: an area or container to plant in

Plant: a species of plant

Planting: A number of a type of Plant planted in a single year (maybe scoped by plot)

Harvest: A quantity of a plant harvested from a planting

Harvest Type: What a harvest's quantity counts — either a unit of measure (pounds, pints, bunches)
or the part of the plant picked (fruit, leaf, root), depending on the plant. Types come from the
seeded `harvest_types` table, readable via `GET /harvest-types`. A plant declares a
`defaultHarvestType`, which a harvest inherits unless the request overrides it with a
`harvestTypeId`; changing a plant's default does not rewrite existing harvests. A planting holds at
most one harvest per day per type — harvests that would collide on that triple are folded into one
and their quantities summed.



Running locally: copy `.env.example` to `.env` and fill in the blanks. `.env` is gitignored, so real
values never go in a commit. The acceptance suite has its own, in `test/acceptance/.env.acceptance`.

Example curl, with a token from feral-authentication-service's login:

``` shell
curl -vX PUT http://localhost:8002/api/vigilant-harvest-service/v0/harvests \
  -H 'content-type: application/json' \
  -H 'x-feral-auth-token: <token>' \
  -d '{
    "harvests": [{
      "plantingId": "<a planting id>",
      "quantity": 1.5,
      "harvestDate": "2026-07-01"
    }]
  }'
```

A harvest's date is the day, as YYYY-MM-DD. Its quantity is stored to the hundredth.

## Known, and kept

**Every granted user shares one garden.** A request needs a token feral issued for this
application, and a user only gets one with a grant to it. Past that, nothing checks who is asking.
`attachActor` sets the token on `request.actor`, with its `roles`, and no handler reads it. So any
granted user can read, change and delete everything. That fits one household. If it ever stops
fitting, check the token's `roles` on writes.

**The routes are uneven.** They stay as they are, because the app calls them this way. Changing them
would be a `v1`, moved with the app.
- The year is a path param in `/journal/:plantingYear`, `/activity-log/:plantingYear` and
  `/planning/:plantingYear`. It's a query param in `/plantings?plantingYear=`,
  `/harvests/summary?plantingYear=`, `/harvests/search?year=` and `/harvests/stats?year=`.
- Journal and activity-log entries are listed by year, but deleted at `/journal/entries/:entryId` and
  `/activity-log/entries/:entryId`.
- Schedule items are addressed by `entryId`.
- Plant categories and subcategories have numeric ids, and everything else has UUIDs.
- `POST /plantings/:plantingId` performs an action on a planting (`actionType`: `START`, `PLANT`,
  `SPLIT`, `RETIRE`, `COMMENT` or `DELETE`), rather than creating anything.

**No pagination.** No list takes a limit or a cursor, and `GET /plantings` without a year answers
every year. At about 140 rows a list, that's fine. Revisit it if a list gets slow.

**Two fields nobody reads.** `GET /planning/:plantingYear` still sends `currentDay`, and
`daysUntilAction` on each planting. The app no longer reads them (its backlog A31).


Plot layouts, how to map a planting to a location in a plot.

Idea #1

add new table, plot_plantings to map coordinates of plantings onto plots

  plot_id,        plot
  planting_id,    planting
  x,              x coordinate
  y,              y coordinate

plot is x long and y wide
limits to rectangular shapes (or does it?)

