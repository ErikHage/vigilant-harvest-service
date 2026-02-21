import { RowDataPacket } from 'mysql2';

export interface PlanningPlanting {
  plantingId: string,
  plantingName: string,
  plantId: string,
  plantName: string,
  currentStatus: string,
  targetPlantingDate?: Date,
  leadTimeDays?: number, // int
}

export interface PlanningPlantingRow extends RowDataPacket {
  plantingId: string,
  plantingName: string,
  plantId: string,
  plantName: string,
  currentStatus: string,
  targetPlantingDate?: string,
  leadTimeWeeks?: number // int
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
