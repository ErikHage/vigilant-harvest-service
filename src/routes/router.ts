import Router, { Express } from 'express';

import getServiceInfo from '../handlers/service-info-handler';
import plotHandlers from '../handlers/plot-handlers';
import plantingHandlers from '../handlers/planting-handlers';
import plantHandlers from '../handlers/plant-handlers';

const router: Express = Router();

const buildRouter = (): Express => {
  router.get('/service-info', getServiceInfo);

  router.put('/plots', plotHandlers.upsertPlot);
  router.get('/plots/{plotId}', plotHandlers.getPlotById);
  router.get('/plots', plotHandlers.getPlots);
  router.delete('/plots/{plotId}', plotHandlers.deletePlotById);

  router.put('/plot-years', plotHandlers.upsertPlotYear);
  router.get('/plot-years/{plotYearId}', plotHandlers.getPlotYearById);
  router.get('/plot-years', plotHandlers.getPlotYears);
  router.delete('/plot-years/{plotId}', plotHandlers.deletePlotYearById);

  router.put('/plantings', plantingHandlers.upsertPlanting);
  router.get('/plantings/{plantingId}', plantingHandlers.getPlantingById);
  router.get('/plantings', plantingHandlers.getPlantings);
  router.delete('/plantings/{plantingId}', plantingHandlers.deletePlantingById);

  router.put('/plants', plantHandlers.upsertPlant);
  router.get('/plants/{plantId}', plantHandlers.getPlantById);
  router.get('/plants', plantHandlers.getPlants);
  router.delete('/plants/{plantId}', plantHandlers.deletePlantById);

  return router;
};

export default buildRouter;
