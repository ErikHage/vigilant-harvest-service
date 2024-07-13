import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import buildApiRouter from './routes/api-router';

const getApp = (appRoot: string, port: string): Express => {
  const app: Express = express();

  app.set('port', port);

  app.use(express.urlencoded({ extended: false, }));
  app.use(bodyParser.json());

  app.use(cors());

  app.use('/v0/api', buildApiRouter());

  return app;
}

export default getApp;
