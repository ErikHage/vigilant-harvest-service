import { Request } from 'express';

import {
  Plant,
  PlantCategory, PlantCategoryRequest,
  PlantCategoryResponse,
  PlantRequest,
  PlantResponse, PlantScheduleAssignmentRequest, PlantSubcategory, PlantSubcategoryRequest, PlantSubcategoryResponse
} from '../services/plants/types';
import scheduleSerializer from './schedules';
import { UNSPECIFIED_HARVEST_TYPE_ID } from '../services/harvest-types/types';
import {
  blankAsMissing,
  bodyOf,
  INT_MAX,
  oneOf,
  optionalBoolean,
  optionalInteger,
  optionalList,
  optionalNumber,
  optionalObject,
  optionalString,
  requiredInteger,
  requiredList,
  requiredString,
  TEXT_BYTES
} from '../validation';

function capitalizeFirstLetter(str: string): string {
  if (!str) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// the column sizes: ids are VARCHAR(36), most text VARCHAR(255), instructions VARCHAR(2000), notes TEXT
const ID = { maxLength: 36, };
const NAME = { maxLength: 255, };
const INSTRUCTIONS = { maxLength: 2000, };
const TEXT = { maxBytes: TEXT_BYTES, };
const MEASURE = { min: 0, max: INT_MAX, };
/** An id from an AUTO_INCREMENT column, which starts at 1. */
const ROW_ID = { min: 1, };

/** The app's choices, lowercased as they are stored. */
const LIFESPAN_TYPES = [ 'annual', 'perennial', 'biennial', 'unknown', ] as const;

/**
 * The sowing columns are VARCHARs that the app fills with free text ("6 weeks
 * before last frost"), so only text is taken. Rows stored as "1" or "0" before
 * are text too, and the app shows them as Yes and No (its B22).
 */
function sowingValue(value: unknown, field: string): string | undefined {
  return optionalString(value, field, NAME);
}

function fromRequest(req: Request): PlantRequest {
  const body = bodyOf(req);
  const taxonomy = optionalObject(body.taxonomy, 'taxonomy');
  const sowing = optionalObject(body.sowing, 'sowing');
  const planting = optionalObject(body.planting, 'planting');
  const growing = optionalObject(body.growing, 'growing');
  const harvesting = optionalObject(body.harvesting, 'harvesting');
  // the edit page's number boxes send '' when cleared (v-model.number)
  const measure = (section: Record<string, unknown>, name: string, field: string): number | undefined =>
    optionalInteger(blankAsMissing(section[name]), field, MEASURE);
  const lifespanType = optionalString(blankAsMissing(body.lifespanType), 'lifespanType');

  return {
    plantId: optionalString(body.plantId, 'plantId', ID),
    subcategoryId: requiredInteger(body.subcategoryId, 'subcategoryId', ROW_ID),
    friendlyName: requiredString(body.friendlyName, 'friendlyName', NAME),
    lifespanType: lifespanType === undefined
      ? 'annual'
      : oneOf(lifespanType.toLowerCase(), 'lifespanType', LIFESPAN_TYPES),
    tags: optionalList(body.tags, 'tags').map((tag, index) => requiredString(tag, `tags[${index}]`, NAME)),
    description: optionalString(body.description, 'description', TEXT),
    taxonomy: {
      family: optionalString(taxonomy.family, 'taxonomy.family', NAME),
      genus: optionalString(taxonomy.genus, 'taxonomy.genus', NAME),
      species: optionalString(taxonomy.species, 'taxonomy.species', NAME),
    },
    sowing: {
      indoor: sowingValue(sowing.indoor, 'sowing.indoor'),
      direct: sowingValue(sowing.direct, 'sowing.direct'),
      germinationDaysRange: optionalString(sowing.germinationDaysRange, 'sowing.germinationDaysRange', NAME),
      germinationTempRange: optionalString(sowing.germinationTempRange, 'sowing.germinationTempRange', NAME),
      sowingNotes: optionalString(sowing.sowingNotes, 'sowing.sowingNotes', TEXT),
    },
    planting: {
      // a DECIMAL(5,2)
      depthInInches: optionalNumber(blankAsMissing(planting.depthInInches), 'planting.depthInInches', { min: 0, max: 999.99, }),
      plantSpacingInches: measure(planting, 'plantSpacingInches', 'planting.plantSpacingInches'),
      rowSpacingInches: measure(planting, 'rowSpacingInches', 'planting.rowSpacingInches'),
      instructions: optionalString(planting.instructions, 'planting.instructions', INSTRUCTIONS),
    },
    growing: {
      requiredSun: optionalString(growing.requiredSun, 'growing.requiredSun', NAME),
      daysToMaturity: measure(growing, 'daysToMaturity', 'growing.daysToMaturity'),
      isClimbing: optionalBoolean(growing.isClimbing, 'growing.isClimbing') ?? false,
      climbingHeightFeet: measure(growing, 'climbingHeightFeet', 'growing.climbingHeightFeet'),
      plantSize: optionalString(growing.plantSize, 'growing.plantSize', NAME),
      growingNotes: optionalString(growing.growingNotes, 'growing.growingNotes', TEXT),
    },
    harvesting: {
      // the service confirms it exists, through the foreign key
      defaultHarvestTypeId: optionalInteger(harvesting.defaultHarvestTypeId, 'harvesting.defaultHarvestTypeId', ROW_ID)
        ?? UNSPECIFIED_HARVEST_TYPE_ID,
      fruitSize: optionalString(harvesting.fruitSize, 'harvesting.fruitSize', NAME),
      shelfStability: optionalString(harvesting.shelfStability, 'harvesting.shelfStability', NAME),
      harvestInstructions: optionalString(harvesting.harvestInstructions, 'harvesting.harvestInstructions', INSTRUCTIONS),
    },
  };
}

function scheduleIds(value: unknown, field: string): string[] {
  return requiredList(value, field).map((id, index) => requiredString(id, `${field}[${index}]`, ID));
}

function fromScheduleAssignmentRequest(req: Request): PlantScheduleAssignmentRequest {
  const body = bodyOf(req);

  return {
    plantId: req.params.plantId!,
    assign: scheduleIds(body.assign, 'assign'),
    unassign: scheduleIds(body.unassign, 'unassign'),
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
    activitySchedules: plant.activitySchedules.map(scheduleSerializer.schedules.toResponse),
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
  fromCategoryRequest: function(req: Request): PlantCategoryRequest {
    return {
      categoryName: requiredString(bodyOf(req).categoryName, 'categoryName', NAME),
    };
  },

  categoryIdFromRequest: function(req: Request): number {
    return requiredInteger(req.params.categoryId, 'categoryId', ROW_ID);
  },

  subcategoryIdFromRequest: function(req: Request): number {
    return requiredInteger(req.params.subcategoryId, 'subcategoryId', ROW_ID);
  },

  toCategoryResponse: function(category: PlantCategory): PlantCategoryResponse {
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

  fromSubcategoryRequest: function(req: Request): PlantSubcategoryRequest {
    return {
      categoryId: requiredInteger(req.params.categoryId, 'categoryId', ROW_ID),
      subcategoryName: requiredString(bodyOf(req).subcategoryName, 'subcategoryName', NAME),
    };
  },

  toSubcategoryResponse: function(subcategory: PlantSubcategory): PlantSubcategoryResponse {
    return {
      categoryId: subcategory.categoryId,
      subcategoryId: subcategory.subcategoryId,
      subcategoryName: subcategory.subcategoryName,
    };
  },
};

export default {
  fromRequest,
  fromScheduleAssignmentRequest,

  toResponse,

  categories,
}
