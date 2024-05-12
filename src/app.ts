import express, { Express } from 'express';

import buildRouter from './routes/router';

const getApp = (appRoot: string, port: string): Express => {
  const app: Express = express();

  app.set('port', port);

  app.use(express.urlencoded({ extended: false, }));

  app.use('/', buildRouter());

  return app;
}

export default getApp;
