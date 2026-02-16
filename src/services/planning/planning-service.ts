import { getDayOfYear } from 'date-fns'

import { ensureError, FeralError } from '../../errors';
import { PlanningDetails, PlanningInstance, PlanningPlanting } from './types';
import plantingYearsMysqlDatasource from '../planting-years/planting-years-mysql-datasource';
import plantingsMysqlDatasource from '../plantings/plantings-mysql-datasource';
import { PlantingYear } from '../planting-years/types';
import constants from '../../util/constants';

async function getPlanningDetailsForYear(year: number): Promise<PlanningDetails> {
  try {
    const currentDay = getCurrentDayOfYear();
    const plantingYear = await plantingYearsMysqlDatasource.getPlantingYear(year);
    const targetPlantingDay = getDayOfYearFromDate(plantingYear.targetPlantingDate);
    const planningInstances = await getPlanningStageItems(plantingYear, targetPlantingDay, currentDay);
    const propagationInstances = await getPropagationStageItems(plantingYear, targetPlantingDay, currentDay);

    return {
      plantingYear: year,
      targetPlantingDay,
      currentDay,
      planning: {
        plantings: planningInstances,
      },
      propagation: {
        plantings: propagationInstances,
      },
    }
  } catch (err) {
    throw new FeralError('Error getting planning details for year', ensureError(err))
      .withDebugParams({ plantingYear: year, });
  }
}

async function getPlanningStageItems(plantingYear: PlantingYear, targetPlantingDay: number, currentDay: number): Promise<PlanningInstance[]> {
  const plantings: PlanningPlanting[] = await plantingsMysqlDatasource.getPlanningPlantings(
    plantingYear.plantingYear,
    constants.plantings.statuses.created);

  return plantings.map(planting => {
    const plannedActionDay = planting.leadTimeDays ? targetPlantingDay - planting.leadTimeDays : undefined
    const daysUntilAction = plannedActionDay ? plannedActionDay - currentDay : undefined

    return {
      plantingId: planting.plantingId,
      plantingName: planting.plantingName,
      plantId: planting.plantId,
      plantName: planting.plantName,
      plannedActionDay,
      daysUntilAction,
    }
  });
}

async function getPropagationStageItems(plantingYear: PlantingYear, targetPlantingDay: number, currentDay: number): Promise<PlanningInstance[]> {
  const plantings: PlanningPlanting[] = await plantingsMysqlDatasource.getPlanningPlantings(
    plantingYear.plantingYear,
    constants.plantings.statuses.started);

  return plantings.map(planting => ({
    plantingId: planting.plantingId,
    plantingName: planting.plantingName,
    plantId: planting.plantId,
    plantName: planting.plantName,
    plannedActionDay: targetPlantingDay,
    daysUntilAction: targetPlantingDay - currentDay,
  }));
}

function getCurrentDayOfYear(): number {
  const now = new Date();
  return getDayOfYearFromDate(now);
}

function getDayOfYearFromDate(date: Date): number {
  return getDayOfYear(date);
}

export default {
  getPlanningDetailsForYear,
};
