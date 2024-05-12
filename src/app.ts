import express, { Express } from 'express';
import dotenv from 'dotenv';

import buildRouter from './routes/router';

const getApp = (appRoot: string, port: string): Express => {
  dotenv.config();

  const app: Express = express();

  app.set('port', port);

  app.use(express.urlencoded({ extended: false, }));

  app.use('/', buildRouter());

  return app;
}

export default getApp;
