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

    const createdStatusPlantings: PlanningPlanting[] = await plantingsMysqlDatasource.getPlanningPlantings(
      plantingYear.plantingYear,
      constants.plantings.statuses.created);

    const directSowPlanningInstances = getDirectSowPlanningItems(createdStatusPlantings, targetPlantingDay, currentDay);
    const indoorSowPlanningInstances = getIndoorSowPlanningItems(createdStatusPlantings, targetPlantingDay, currentDay);
    const startedInstances = await getPropagationStageItems(plantingYear, targetPlantingDay, currentDay);

    return {
      plantingYear: year,
      targetPlantingDay,
      currentDay,
      toStart: {
        plantings: indoorSowPlanningInstances
          .sort(sortByDaysUntilAction),
      },
      toPlant: {
        plantings: directSowPlanningInstances
          .concat(startedInstances)
          .sort(sortByDaysUntilAction),
      },
    }
  } catch (err) {
    throw new FeralError('Error getting planning details for year', ensureError(err))
      .withDebugParams({ plantingYear: year, });
  }
}

function getDirectSowPlanningItems(plantings: PlanningPlanting[], defaultTargetPlantingDay: number, currentDay: number): PlanningInstance[] {
  return plantings
    .filter(hasNoLeadTime)
    .map(planting => {
      const targetPlantingDay = planting.targetPlantingDate ? getDayOfYearFromDate(planting.targetPlantingDate) : defaultTargetPlantingDay;
      const daysUntilAction = targetPlantingDay - currentDay;

      return {
        plantingId: planting.plantingId,
        plantingName: planting.plantingName,
        plantId: planting.plantId,
        plantName: planting.plantName,
        plannedActionDay: targetPlantingDay,
        daysUntilAction,
      }
    });
}

function getIndoorSowPlanningItems(plantings: PlanningPlanting[], defaultTargetPlantingDay: number, currentDay: number): PlanningInstance[] {
   return plantings
    .filter(hasDefinedLeadTime)
    .map(planting => {
      const targetPlantingDay = planting.targetPlantingDate ? getDayOfYearFromDate(planting.targetPlantingDate) : defaultTargetPlantingDay;
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

async function getPropagationStageItems(plantingYear: PlantingYear, defaultTargetPlantingDay: number, currentDay: number): Promise<PlanningInstance[]> {
  const plantings: PlanningPlanting[] = await plantingsMysqlDatasource.getPlanningPlantings(
    plantingYear.plantingYear,
    constants.plantings.statuses.started);

  return plantings
    .map(planting => {
      const targetPlantingDay = planting.targetPlantingDate ? getDayOfYearFromDate(planting.targetPlantingDate) : defaultTargetPlantingDay;

      return {
        plantingId: planting.plantingId,
        plantingName: planting.plantingName,
        plantId: planting.plantId,
        plantName: planting.plantName,
        plannedActionDay: targetPlantingDay,
        daysUntilAction: targetPlantingDay - currentDay,
      };
    });
}

function sortByDaysUntilAction(a: PlanningInstance, b: PlanningInstance) {
  const aVal = a.daysUntilAction;
  const bVal = b.daysUntilAction;

  // push nulls/undefined to bottom
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;

  return aVal - bVal;
}

function getCurrentDayOfYear(): number {
  const now = new Date();
  return getDayOfYearFromDate(now);
}

function getDayOfYearFromDate(date: Date): number {
  return getDayOfYear(date);
}

function hasNoLeadTime(planting: PlanningPlanting) {
  return planting.leadTimeDays === undefined || planting.leadTimeDays === 0;
}

function hasDefinedLeadTime(planting: PlanningPlanting) {
  return planting.leadTimeDays !== undefined;
}

export default {
  getPlanningDetailsForYear,
};
