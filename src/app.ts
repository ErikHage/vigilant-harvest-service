import express, { Express } from 'express';

import buildRouter from './routes/router';
import bodyParser from 'body-parser';

const getApp = (appRoot: string, port: string): Express => {
  const app: Express = express();

  app.set('port', port);

  app.use(express.urlencoded({ extended: false, }));
  app.use(bodyParser.json());

  app.use('/v0/api', buildRouter());

  return app;
}

export default getApp;
