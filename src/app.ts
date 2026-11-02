import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import buildApiRouter from './routes/api-router';
import errorHandler from './middleware/error-handler';

const getApp = (appRoot: string, port: string): Express => {
  const app: Express = express();

  app.set('port', port);
  app.disable('x-powered-by');

  app.use(express.urlencoded({ extended: false, }));
  app.use(bodyParser.json());

  app.use(cors());

  app.use('/api/vigilant-harvest-service/v0', buildApiRouter());

  // The body parsers above run before the API router, so their errors (a body
  // that isn't JSON) never reach the router's handler.
  app.use(errorHandler);

  return app;
}

export default getApp;
