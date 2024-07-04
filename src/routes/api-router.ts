import Router, { Express } from 'express';

import getServiceInfo from '../handlers/service-info-handler';
import plotHandlers from '../handlers/plot-handlers';
import plantingHandlers from '../handlers/planting-handlers';
import plantHandlers from '../handlers/plant-handlers';
import harvestHandlers from '../handlers/harvest-handlers';

const apiRouter: Express = Router();

const buildRouter = (): Express => {
  apiRouter.get('/service-info', getServiceInfo);

  apiRouter.put('/plots', plotHandlers.upsertPlot);
  apiRouter.get('/plots/{plotId}', plotHandlers.getPlotById);
  apiRouter.get('/plots', plotHandlers.getPlots);
  apiRouter.delete('/plots/{plotId}', plotHandlers.deletePlotById);

  apiRouter.put('/plot-years', plotHandlers.upsertPlotYear);
  apiRouter.get('/plot-years/{plotYearId}', plotHandlers.getPlotYearById);
  apiRouter.get('/plot-years', plotHandlers.getPlotYears);
  apiRouter.delete('/plot-years/{plotId}', plotHandlers.deletePlotYearById);

  apiRouter.put('/plantings', plantingHandlers.upsertPlanting);
  apiRouter.get('/plantings/{plantingId}', plantingHandlers.getPlantingById);
  apiRouter.get('/plantings', plantingHandlers.getPlantings);
  apiRouter.delete('/plantings/{plantingId}', plantingHandlers.deletePlantingById);

  apiRouter.put('/plants', plantHandlers.upsertPlant);
  apiRouter.get('/plants/{plantId}', plantHandlers.getPlantById);
  apiRouter.get('/plants', plantHandlers.getPlants);
  apiRouter.delete('/plants/{plantId}', plantHandlers.deletePlantById);

  apiRouter.put('/harvests', harvestHandlers.upsertHarvest);
  apiRouter.get('/harvests/{harvestId}', harvestHandlers.getHarvestById);
  apiRouter.get('/harvests', harvestHandlers.getHarvests);
  apiRouter.delete('/harvests/{harvestId}', harvestHandlers.deleteHarvestById);

  return apiRouter;
};

export default buildRouter;
