# vigilant-harvest-service

A collection of APIs for the vigilant-harvest-app

Plot: an area or container to plant in

Plant: a species of plant

Planting: A number of a type of Plant planted in a single year (maybe scoped by plot)

Harvest: A quantity of a plant harvested from a planting

Harvest Type: What a harvest's quantity counts — either a unit of measure (pounds, pints, bunches)
or the part of the plant picked (fruit, leaf, root), depending on the plant. Types come from the
seeded `harvest_types` table, readable via `GET /harvest-types`. A plant declares a
`defaultHarvestType`, and a harvest inherits it at creation time; changing a plant's default does
not rewrite existing harvests. Harvests recorded against the same planting on the same day are
merged into one only when they share a harvest type, so a day can hold one harvest per type.



Example curl:

``` shell
curl -vX PUT http://localhost:8002/api/vigilant-harvest-service/v0/harvests \
  -H 'content-type: application/json' \
  -d '{
    "harvests": [{
      "plantingId": "1",
      "quantity": "1",
      "harvestDate": "2024-11-09T00:00:00"
    }]
  }'
```


Plot layouts, how to map a planting to a location in a plot.

Idea #1

add new table, plot_plantings to map coordinates of plantings onto plots

  plot_id,        plot
  planting_id,    planting
  x,              x coordinate
  y,              y coordinate

plot is x long and y wide
limits to rectangular shapes (or does it?)

