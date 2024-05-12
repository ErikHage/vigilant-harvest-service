import Router, { Express } from 'express';

import getServiceInfo from '../handlers/service-info-handler';
import plotHandlers from '../handlers/plot-handlers';

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

  return router;
};

export default buildRouter;
