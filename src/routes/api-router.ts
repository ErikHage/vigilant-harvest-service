import Router, { Express } from 'express';

import getServiceInfo from '../handlers/service-info-handler';
import plotHandlers from '../handlers/plot-handlers';
import plantingHandlers from '../handlers/planting-handlers';
import plantingYearHandlers from '../handlers/planting-year-handlers';
import plantHandlers from '../handlers/plant-handlers';
import planningHandlers from '../handlers/planning-handlers';
import harvestHandlers from '../handlers/harvest-handlers';
import journalHandlers from '../handlers/journal-handlers';
import activityLogHandlers from '../handlers/activity-log-handlers';
import logRequests from '../middleware/log-requests';
import attachActor from '../middleware/attach-actor';
import errorHandler from '../middleware/error-handler';

const apiRouter: Express = Router();

const buildRouter = (): Express => {
  apiRouter.use(logRequests);

  apiRouter.get('/service-info', getServiceInfo);

  apiRouter.use(attachActor);

  apiRouter.put('/planting-years', plantingYearHandlers.insertPlantingYear);
  apiRouter.get('/planting-years', plantingYearHandlers.getPlantingYears);
  apiRouter.get('/planting-years/:plantingYear', plantingYearHandlers.getPlantingYear);

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
  apiRouter.get('/plants/:plantId', plantHandlers.getPlantById);
  apiRouter.get('/plants', plantHandlers.getPlants);
  apiRouter.delete('/plants/:plantId', plantHandlers.deletePlantById);

  apiRouter.put('/harvests', harvestHandlers.upsertHarvests);
  apiRouter.get('/harvests/summary', harvestHandlers.getHarvestSummary);
  apiRouter.get('/harvests/search', harvestHandlers.searchHarvests);
  apiRouter.get('/harvests/stats', harvestHandlers.getHarvestStats);
  apiRouter.delete('/harvests/:harvestId', harvestHandlers.deleteHarvestById);

  apiRouter.put('/journal', journalHandlers.upsertJournalEntry);
  apiRouter.get('/journal/:plantingYear', journalHandlers.getJournalEntries);

  apiRouter.put('/activity-log', activityLogHandlers.upsertActivityLogEntry);
  apiRouter.get('/activity-log/:plantingYear', activityLogHandlers.getActivityLogEntries);

  apiRouter.use(errorHandler);

  return apiRouter;
};

export default buildRouter;
