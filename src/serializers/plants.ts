import { Request } from 'express';

import {
  Plant,
  PlantCategory,
  PlantCategoryResponse,
  PlantRequest,
  PlantResponse
} from '../services/plants/types';

function capitalizeFirstLetter(str: string): string {
  if (!str) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function fromRequest(req: Request): PlantRequest {
  return {
    plantId: req.body.plantId,
    subcategoryId: req.body.subcategoryId,
    friendlyName: req.body.friendlyName,
    lifespanType: req.body.lifespanType?.toLowerCase() ?? 'annual',
    tags: req.body.tags ?? [],
    description: req.body.description,
    taxonomy: {
      family: req.body.taxonomy?.family,
      genus: req.body.taxonomy?.genus,
      species: req.body.taxonomy?.species,
    },
    sowing: {
      indoor: req.body.sowing?.indoor,
      direct: req.body.sowing?.direct,
      germinationDaysRange: req.body.sowing?.germinationDaysRange,
      germinationTempRange: req.body.sowing?.germinationTempRange,
      sowingNotes: req.body.sowing?.sowingNotes,
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
      growingNotes: req.body.growing?.growingNotes,
    },
    harvesting: {
      fruitSize: req.body.harvesting?.fruitSize,
      shelfStability: req.body.harvesting?.shelfStability,
      harvestInstructions: req.body.harvesting?.harvestInstructions,
    },
  };
}

function toResponse(plant: Plant): PlantResponse {
  return {
    plantId: plant.plantId,
    category: plant.category,
    categoryId: plant.categoryId,
    subcategory: plant.subcategory,
    subcategoryId: plant.subcategoryId,
    friendlyName: plant.friendlyName,
    lifespanType: capitalizeFirstLetter(plant.lifespanType),
    tags: plant.tags,
    description: plant.description,
    taxonomy: plant.taxonomy,
    sowing: plant.sowing,
    planting: plant.planting,
    growing: plant.growing,
    harvesting: plant.harvesting,
    dateCreated: plant.dateCreated!,
    dateModified: plant.dateModified!,
  };
}

const categories = {
  toResponse: function(category: PlantCategory): PlantCategoryResponse {
    return {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      subcategories : category.subcategories.map(subcategory => ({
        categoryId: subcategory.categoryId,
        subcategoryId: subcategory.subcategoryId,
        subcategoryName: subcategory.subcategoryName,
      })),
    };
  },
};

export default {
  fromRequest,
  toResponse,

  categories,
}
