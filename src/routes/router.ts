import Router, { Express, Response, Request } from 'express';
import * as packageJson from '../../package.json';

const router: Express = Router();

function getServiceInfo(request: Request, response: Response) {
  response.status(200).json({
    name: 'vigilant-harvest-service',
    version: packageJson.version,
  });
}

const buildRouter = (): Express => {
  router.get('/service-info', getServiceInfo);

  return router;
};

export default buildRouter;
