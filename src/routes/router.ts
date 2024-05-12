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

  return router;
};

export default buildRouter;
