import { Plot, PlotRow, PlotYear, PlotYearRow } from './types';

import mysqlUtils from '../../database/mysql-utils';

const plots = {
  insert: {
    toParams: function(plot: Plot): Array<string | number> {
      return [
        plot.plotId,
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

const plotYears = {
  insert: {
    toParams: function(plotYear: PlotYear): Array<string | number> {
      return [
        plotYear.plotYearId,
        plotYear.plotId,
        plotYear.numRows,
        plotYear.numColumns,
        plotYear.year,
      ];
    },
  },

  fromRow: function(plotYearRow: PlotYearRow): PlotYear {
    return {
      plotYearId: plotYearRow.plot_year_id,
      plotId: plotYearRow.plot_id,
      numRows: plotYearRow.num_rows,
      numColumns: plotYearRow.num_columns,
      year: plotYearRow.year,
    }
  },
};

export default {
  plots,
  plotYears,
}
