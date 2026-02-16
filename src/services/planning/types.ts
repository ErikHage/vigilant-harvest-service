import { RowDataPacket } from 'mysql2';

export interface PlanningPlanting {
  plantingId: string,
  plantingName: string,
  plantId: string,
  plantName: string,
  currentStatus: string,
  leadTimeDays?: number, // int
}

export interface PlanningPlantingRow extends RowDataPacket {
  plantingId: string,
  plantingName: string,
  plantId: string,
  plantName: string,
  currentStatus: string,
  leadTimeWeeks?: number // int
  // TODO add target planting date to override the target planting date on planting year
  // sowDate?: Date,
  // transplantDate?: Date,
}

export interface PlanningInstance {
  plantingId: string,
  plantingName: string,
  plantId: string,
  plantName: string,
  plannedActionDay?: number, // int (day of year)
  daysUntilAction?: number, // int
}

export interface PlanningDetails {
  plantingYear: number, // int
  targetPlantingDay: number, // int (day of year)
  currentDay: number, // int (day of year)

  planning: {
    plantings: PlanningInstance[],
  },

  propagation: {
    plantings: PlanningInstance[],
  },

  // no support for this stage right now
  // production: {
  //   plantings: PlanningInstance[],
  // },
}

export interface PlanningInstanceResponse {
  plantingId: string,
  plantingName: string,
  plantId: string,
  plantName: string,
  plannedActionDay?: number, // int (day of year)
  daysUntilAction?: number, // int
}

export interface PlanningDetailsResponse {
  plantingYear: number, // int
  targetPlantingDay: number, // int (day of year)
  currentDay: number, // int (day of year)

  planning: {
    plantings: PlanningInstanceResponse[],
  },

  propagation: {
    plantings: PlanningInstanceResponse[],
  },
}
