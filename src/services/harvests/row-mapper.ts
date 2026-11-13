import {
  Harvest,
  HarvestRow,
  HarvestSearchRequest,
  HarvestSummary,
  HarvestSummaryRequest,
  HarvestSummaryRow, HarvestUpsertInstruction, HydratedHarvest, HydratedHarvestRow,
  StoredHarvest,
  StoredHarvestRow
} from './types';

function fromRow(row: HarvestRow): Harvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    quantity: Number(row.quantity), // a DECIMAL, which mysql2 reads as a string
    harvestDate: row.harvest_date, // a DATE column: YYYY-MM-DD, as it was sent
    harvestTypeId: row.harvest_type_id,
    harvestType: row.harvest_type_name,
  }
}

function fromHydratedRow(row: HydratedHarvestRow): HydratedHarvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    plantingName: row.planting_name,
    plantId: row.plant_id,
    plantName: row.plant_name,
    plotName: row.plot_name,
    quantity: Number(row.quantity), // a DECIMAL, which mysql2 reads as a string
    harvestDate: row.harvest_date, // a DATE column: YYYY-MM-DD, as it was sent
    harvestTypeId: row.harvest_type_id,
    harvestType: row.harvest_type_name,
  }
}

function fromStoredRow(row: StoredHarvestRow): StoredHarvest {
  return {
    ...fromRow(row),
    plantingYear: row.planting_year,
    dateCreated: row.date_created,
  };
}

const insert = {
  toParams: (harvest: HarvestUpsertInstruction): Array<string | number | null> => ([
    harvest.harvestId,
    harvest.plantingId,
    harvest.plantingYear,
    harvest.quantity,
    harvest.harvestDate,
    harvest.harvestTypeId,
    harvest.dateCreated ?? null,
  ]),
};

const summary = {
  toParams: (request: HarvestSummaryRequest): Array<string | number> => ([
    request.plantingYear,
  ]),

  fromRow: (row: HarvestSummaryRow): HarvestSummary => ({
    plantingYear: row.planting_year,
    plantingId: row.planting_id,
    quantity: Number(row.quantity), // SUM of a DECIMAL, which mysql2 reads as a string
    harvestTypeId: row.harvest_type_id,
    harvestType: row.harvest_type_name,
  }),
};

const search = {
  toParams: (request: HarvestSearchRequest): Array<string | number> => ([
    request.year,
  ]),
};

const getByPlantingIdDateAndType = {
  toParams: (plantingId: string, harvestDate: string, harvestTypeId: number): Array<string | number> => ([
    plantingId,
    harvestDate,
    harvestTypeId,
  ]),
};

export default {
  insert,
  getByPlantingIdDateAndType,
  summary,
  search,
  fromRow,
  fromStoredRow,
  fromHydratedRow,
}
