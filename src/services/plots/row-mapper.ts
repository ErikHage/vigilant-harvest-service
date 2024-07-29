import { Plot, PlotRow } from './types';

import mysqlUtils from '../../database/mysql-utils';

const plots = {
  insert: {
    toParams: function(plot: Plot): Array<string | number> {
      return [
        plot.plotId,
        plot.friendlyName,
        plot.lengthInInches,
        plot.widthInInches,
        plot.plotType,
        mysqlUtils.booleanToDbInt(plot.isActive),
      ];
    },
  },

  fromRow: function(row: PlotRow): Plot {
    return {
      plotId: row.plot_id,
      friendlyName: row.friendly_name,
      lengthInInches: row.length_in_inches,
      widthInInches: row.width_in_inches,
      plotType: row.plot_type,
      isActive: row.is_active,
    }
  },
};

export default {
  plots,
}
