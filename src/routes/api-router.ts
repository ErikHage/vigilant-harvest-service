import Router, { Express, NextFunction, Request, Response } from 'express';

import getHealth from '../handlers/health-handler';
import getServiceInfo from '../handlers/service-info-handler';
import plotHandlers from '../handlers/plot-handlers';
import plantingHandlers from '../handlers/planting-handlers';
import plantingYearHandlers from '../handlers/planting-year-handlers';
import plantHandlers from '../handlers/plant-handlers';
import planningHandlers from '../handlers/planning-handlers';
import harvestHandlers from '../handlers/harvest-handlers';
import harvestTypeHandlers from '../handlers/harvest-type-handlers';
import journalHandlers from '../handlers/journal-handlers';
import scheduleHandlers from '../handlers/schedule-handlers';
import activityLogHandlers from '../handlers/activity-log-handlers';
import logRequests from '../middleware/log-requests';
import attachActor from '../middleware/attach-actor';
import errorHandler from '../middleware/error-handler';
import { NotFoundError } from '../errors/common';

const apiRouter: Express = Router();

const buildRouter = (): Express => {
  // `Router` here is express() itself, so this is a mounted app with its own
  // settings: disabling the header in app.ts alone doesn't reach these routes.
  apiRouter.disable('x-powered-by');

  // Before the request log, so the HEALTHCHECK doesn't add a line every 30s.
  apiRouter.get('/health', getHealth);

  apiRouter.use(logRequests);

  apiRouter.get('/service-info', getServiceInfo);

  apiRouter.use(attachActor());

  apiRouter.put('/planting-years', plantingYearHandlers.insertPlantingYear);
  apiRouter.get('/planting-years', plantingYearHandlers.getPlantingYears);
  apiRouter.get('/planting-years/:plantingYear', plantingYearHandlers.getPlantingYear);
  apiRouter.delete('/planting-years/:plantingYear', plantingYearHandlers.deletePlantingYear);

  apiRouter.put('/plots', plotHandlers.upsertPlot);
  apiRouter.get('/plots/:plotId', plotHandlers.getPlotById);
  apiRouter.get('/plots', plotHandlers.getPlots);
  apiRouter.delete('/plots/:plotId', plotHandlers.deletePlotById);

  apiRouter.post('/plantings', plantingHandlers.createPlanting);
  apiRouter.post('/plantings/:plantingId', plantingHandlers.performPlantingAction);
  apiRouter.put('/plantings/:plantingId', plantingHandlers.updatePlanting);
  apiRouter.get('/plantings/:plantingId', plantingHandlers.getPlantingById);
  apiRouter.get('/plantings', plantingHandlers.getPlantings);
  apiRouter.delete('/plantings/:plantingId', plantingHandlers.deletePlantingById);

  apiRouter.get('/planning/:plantingYear', planningHandlers.getPlanningDetailsByYear);

  apiRouter.put('/plants', plantHandlers.upsertPlant);
  apiRouter.put('/plants/:plantId/activity-schedules', plantHandlers.updateScheduleAssignment);
  apiRouter.get('/plants/:plantId', plantHandlers.getPlantById);
  apiRouter.get('/plants', plantHandlers.getPlants);
  apiRouter.delete('/plants/:plantId', plantHandlers.deletePlantById);

  apiRouter.post('/plant-categories', plantHandlers.insertCategory);
  apiRouter.get('/plant-categories', plantHandlers.getCategories);
  apiRouter.delete('/plant-categories/:categoryId', plantHandlers.deleteCategoryById);
  apiRouter.post('/plant-categories/:categoryId/plant-subcategories', plantHandlers.insertSubcategory);
  apiRouter.delete('/plant-categories/:categoryId/plant-subcategories/:subcategoryId',
    plantHandlers.deleteSubcategoryById);

  apiRouter.get('/harvest-types', harvestTypeHandlers.getHarvestTypes);

  apiRouter.put('/harvests', harvestHandlers.upsertHarvests);
  apiRouter.get('/harvests/summary', harvestHandlers.getHarvestSummary);
  apiRouter.get('/harvests/search', harvestHandlers.searchHarvests);
  apiRouter.get('/harvests/stats', harvestHandlers.getHarvestStats);
  apiRouter.delete('/harvests/:harvestId', harvestHandlers.deleteHarvestById);

  apiRouter.put('/journal', journalHandlers.upsertJournalEntry);
  apiRouter.get('/journal/:plantingYear', journalHandlers.getJournalEntries);
  apiRouter.delete('/journal/entries/:entryId', journalHandlers.deleteJournalEntry);

  apiRouter.post('/activity-schedules', scheduleHandlers.createSchedule);
  apiRouter.get('/activity-schedules', scheduleHandlers.listSchedules);
  apiRouter.get('/activity-schedules/:activityScheduleId', scheduleHandlers.getScheduleById);
  apiRouter.patch('/activity-schedules/:activityScheduleId', scheduleHandlers.updateSchedule);
  apiRouter.delete('/activity-schedules/:activityScheduleId', scheduleHandlers.deleteSchedule);

  apiRouter.post('/activity-schedules/:activityScheduleId/schedule-items', scheduleHandlers.addScheduleItem);
  apiRouter.patch('/activity-schedules/:activityScheduleId/schedule-items/:entryId', scheduleHandlers.updateScheduleItem);
  apiRouter.delete('/activity-schedules/:activityScheduleId/schedule-items/:entryId', scheduleHandlers.deleteScheduleItem);

  apiRouter.put('/activity-log', activityLogHandlers.upsertActivityLogEntry);
  apiRouter.get('/activity-log/:plantingYear', activityLogHandlers.getActivityLogEntries);
  apiRouter.delete('/activity-log/entries/:entryId', activityLogHandlers.deleteActivityLogEntry);

  // After attachActor, so a caller without a good token can't probe which
  // routes exist: it's told 401, as on every route above.
  apiRouter.use((request: Request, response: Response, next: NextFunction) => {
    next(new NotFoundError(`No route for ${request.method} ${request.path}`));
  });

  apiRouter.use(errorHandler);

  return apiRouter;
};

export default buildRouter;
