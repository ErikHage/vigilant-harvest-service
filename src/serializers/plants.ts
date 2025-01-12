import { Request } from 'express';

import { Plant, PlantRequest, PlantResponse } from '../services/plants/types';

export default {
  fromRequest: (req: Request): PlantRequest => ({
    plantId: req.body.plantId,
    category: req.body.category,
    friendlyName: req.body.friendlyName,
    seedSource: req.body.seedSource,
    tags: req.body.tags ?? [],
    description: req.body.description,
    taxonomy: {
      family: req.body.taxonomy.family,
      genus: req.body.taxonomy.genus,
      species: req.body.taxonomy.species,
    },
    sowing: {
      indoor: req.body.sowing?.indoor,
      direct: req.body.sowing?.direct,
      germinationDaysRange: req.body.sowing?.germinationDaysRange,
      germinationTempRange: req.body.sowing?.germinationTempRange,
    },
    planting: {
      depthInInches: req.body.planting?.depthInInches,
      plantSpacingInches: req.body.planting?.plantSpacingInches,
      rowSpacingInches: req.body.planting?.rowSpacingInches,
      instructions: req.body.planting?.instructions,
    },
    growing: {
      requiredSun: req.body.growing?.requiredSun,
      daysToMaturity: req.body.growing?.daysToMaturity,
      isClimbing: !!req.body.growing?.isClimbing,
      climbingHeightFeet: req.body.growing?.climbingHeightFeet,
      plantSize: req.body.growing?.plantSize,
    },
    harvesting: {
      fruitSize: req.body.harvesting?.fruitSize,
      shelfStability: req.body.harvesting?.shelfStability,
      harvestInstructions: req.body.harvesting?.harvestInstructions,
    },
  }),

  toResponse: (plant: Plant): PlantResponse => ({
    plantId: plant.plantId,
    category: plant.category,
    friendlyName: plant.friendlyName,
    seedSource: plant.seedSource,
    tags: plant.tags,
    description: plant.description,
    taxonomy: plant.taxonomy,
    sowing: plant.sowing,
    planting: plant.planting,
    growing: plant.growing,
    harvesting: plant.harvesting,
    dateCreated: plant.dateCreated!,
    dateModified: plant.dateModified!,
  }),
}
