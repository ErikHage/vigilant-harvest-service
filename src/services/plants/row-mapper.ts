import { Plant, PlantRow } from './types';

function fromRow(row: PlantRow): Plant {
  return {
    plantId: row.plant_id,
    family: row.family,
    genus: row.genus,
    species: row.species,
    friendlyName: row.friendly_name,
  }
}

const insert = {
  toParams: (plant: Plant): Array<string> => ([
    plant.plantId,
    plant.family,
    plant.genus,
    plant.species,
    plant.friendlyName,
  ]),
};

export default {
  insert,
  fromRow,
}
