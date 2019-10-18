/**
 * @file Initializes the application, fetching all environment and secret manager, and param store variables,
 * the express app and port to listen on
 * @author Jose Colella <jose.colella@dynatrace.com>
 * @version 1.0
 */

import 'reflect-metadata';
import 'source-map-support/register';

// Libraries
import { Application, NextFunction, Request, Response, Router } from 'express';
import httpStatusCodes from 'http-status-codes';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import inversifyConfig from '../ioc/inversify.config';
import { config } from 'dotenv';
import applicationConfig from '../app';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { Todo } from '@api/api/todo/todo.model';

(async (): Promise<void> => {
  config();
  const container: Container = inversifyConfig();
  const application: Application = applicationConfig();
  const port = Number(process.env.PORT) || 8080;

  const router: Router = Router({
    mergeParams: true,
    caseSensitive: true,
    strict: false,
  });

  const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT,
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci',
    },
  } as SequelizeOptions);
  sequelize.addModels([Todo]);
  await Promise.resolve(sequelize.authenticate());
  await Promise.resolve(sequelize.sync({ force: true }));

  const server: InversifyExpressServer = new InversifyExpressServer(container, router, { rootPath: '/' }, application);
  server.setErrorConfig((app: Application) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((req: Request, res: Response, next: NextFunction) => {
      res
        .status(httpStatusCodes.NOT_FOUND)
        .json({ status: httpStatusCodes.NOT_FOUND, message: 'Endpoint is not found' });
    });
  });
  const serverInstance = server.build();
  serverInstance.listen(port, '0.0.0.0', () => {
    console.log(`${process.env.APP_NAME} listening on ${port}`);
  });
})()
  .then(() => {
    console.log(`${process.env.APP_NAME} has been initialized`);
  })
  .catch((error: Error) => {
    throw error;
  });
