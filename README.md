# vigilant-harvest-service

A collection of APIs for the vigilant-harvest-app

Plot: an area or container to plant in

Plant: a species of plant

Planting: A number of a type of Plant planted in a single year (maybe scoped by plot)



Do I care about the dimensions and location of each planting? Should we keep it simple to start?

Models:
  Plot
  Plant

Instances of Models: 
  PlotYear (do I need this?)
  Planting

some kind of link between Planting and plot


How about this? Might only need 4 types for now

Plots
Plants

Planting -> add plot id to this, many to one plot 

Harvest -> many to one planting

Later on, add more details to plantings, like notes


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
