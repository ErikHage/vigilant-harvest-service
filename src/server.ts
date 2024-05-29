#!/usr/bin/env node

import http from 'http';
import path from "path";
import dotenv from 'dotenv';

import getApp from './app';
// @ts-ignore
// import schemaUtils from './util/schema-utils';
// import utils from './util/utilities';

const onError = (port: string) => (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = (port: string) => () => {
    console.log('Listening on port ' + port);
};

const initApp = async () => {
  dotenv.config();

  const appRoot = path.resolve(__dirname);
  const port = process.env.PORT || '8002';

  console.log(`trying to start app on port ${port}`);
  console.log(`app root is ${appRoot}`);

  const app = getApp(appRoot, port);

  // try {
  //   const deploymentEnvironment = process.env.DEPLOYMENT_ENVIRONMENT;
  //   console.log(`trying to migrate database in ${deploymentEnvironment}`);
  //   const sleepTime = 20;
  //
  //   if (deploymentEnvironment !== 'dev') {
  //     console.log(`Sleeping ${sleepTime} seconds for database to start`);
  //     await utils.sleep(sleepTime * 1000);
  //   }
  //
  //   await schemaUtils.performMigration();
  // } catch (err) {
  //   // @ts-ignore
  //   console.log(`Error performing database migration: ${err.message}`);
  //   process.exit(1);
  // }

  http.createServer(app)
    .listen(port)
    .on('error', onError(port))
    .on('listening', onListening(port));
};

initApp();
