import { Plot, PlotRow } from './types';
import mysqlUtils from '../../database/mysql-utils';

function fromRow(row: PlotRow): Plot {
  return {
    plotId: row.plot_id,
    lengthInInches: row.length_in_inches,
    widthInInches: row.width_in_inches,
    plotType: row.plot_type,
    isActive: mysqlUtils.dbIntToBoolean(row.is_active),
  }
}

const insert = {
  toParams: (plant: Plot): Array<string | number> => ([
    plant.plotId,
    plant.lengthInInches,
    plant.widthInInches,
    plant.plotType,
    mysqlUtils.booleanToDbInt(plant.isActive),
  ]),
};

export default {
  insert,
  fromRow,
}
