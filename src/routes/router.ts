import Router, { Express } from 'express';

import getServiceInfo from '../handlers/service-info-handler';

const router: Express = Router();

const buildRouter = (): Express => {
  router.get('/service-info', getServiceInfo);

  return router;
};

export default buildRouter;
