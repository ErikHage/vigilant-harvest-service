# vigilant-harvest-service

A collection of APIs for the vigilant-harvest-app

Plot: an area or container to plant in

Plant: a species of plant

Planting: A number of a type of Plant planted in a single year (maybe scoped by plot)

Harvest: A quantity of a plant harvested from a planting



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
