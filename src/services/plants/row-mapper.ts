import { Plant, PlantRow } from './types';
import mysqlUtils from '../../database/mysql-utils';

function fromRow(row: PlantRow): Plant {
  return {
    plantId: row.plant_id,
    category: row.category,
    tags: row.tags === '' ? [] : JSON.parse(row.tags),
    description: row.plant_description,
    friendlyName: row.friendly_name,
    dateCreated: row.date_created,
    dateModified: row.date_modified,
    taxonomy: {
      family: row.family,
      genus: row.genus,
      species: row.species,
    },
    sowing: {
      indoor: row.indoor_sowing,
      direct: row.direct_sowing,
      germinationDaysRange: row.germination_days_range,
      germinationTempRange: row.germination_temp_range,
      sowingNotes: row.sowing_notes,
    },
    planting: {
      depthInInches: row.planting_depth_inches,
      plantSpacingInches: row.plant_spacing_inches,
      rowSpacingInches: row.row_spacing_inches,
      instructions: row.planting_instructions,
    },
    growing: {
      requiredSun: row.required_sun,
      daysToMaturity: row.days_to_maturity,
      isClimbing: mysqlUtils.dbIntToBoolean(row.is_climbing),
      climbingHeightFeet: row.climbing_height_feet,
      plantSize: row.plant_size,
      growingNotes: row.growing_notes,
    },
    harvesting: {
      fruitSize: row.fruit_size,
      shelfStability: row.shelf_stability,
      harvestInstructions: row.harvest_instructions,
    },
  }
}

const insert = {
  toParams: (plant: Plant): Array<string | number | null> => ([
    plant.plantId,
    plant.category,
    JSON.stringify(plant.tags),
    plant.description,
    plant.friendlyName,
    plant.taxonomy.family,
    plant.taxonomy.genus,
    plant.taxonomy.species,
    plant.sowing.indoor ?? null,
    plant.sowing.direct ?? null,
    plant.sowing.germinationDaysRange ?? null,
    plant.sowing.germinationTempRange ?? null,
    plant.sowing.sowingNotes ?? null,
    plant.planting.depthInInches ?? null,
    plant.planting.plantSpacingInches ?? null,
    plant.planting.rowSpacingInches ?? null,
    plant.planting.instructions ?? null,
    plant.growing.requiredSun ?? null,
    plant.growing.daysToMaturity ?? null,
    mysqlUtils.nullableBooleanToDbInt(plant.growing.isClimbing),
    plant.growing.climbingHeightFeet ?? null,
    plant.growing.plantSize ?? null,
    plant.growing.growingNotes ?? null,
    plant.harvesting.fruitSize ?? null,
    plant.harvesting.shelfStability ?? null,
    plant.harvesting.harvestInstructions ?? null,
  ]),
};

export default {
  insert,
  fromRow,
}
