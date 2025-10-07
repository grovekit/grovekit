
import {assets_path, HonoInstance } from './utils.js';
import { runAsyncMain, Logger, getLoggerOptsFromEnv } from '@grovekit/utils';
import path from 'node:path';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static'
import {getDB, getDBOptsFromEnv} from '@grovekit/database';
import { Config, getConfigFromEnv } from './config.js';
import { rootController } from './controllers/root.js';
import { deviceListController } from './controllers/device-list.js';
import { deviceDetailController } from './controllers/device-details.js';
import { readFile } from 'node:fs/promises';
import { is } from '@deepkit/type';
import { alertsController } from './controllers/alerts.js';

import { reportListController } from './controllers/reports/report-list.js';
import { reportDeleteController } from './controllers/reports/report-delete.js';
import { reportDetailsController } from './controllers/reports/report-details.js';
import { reportCSVController } from './controllers/reports/report-csv.js';
import { reportRenderController } from './controllers/reports/report-render.js';
import { deviceWithSelectedPropertiesController } from './controllers/device-details/device-with-selected-properties.js';
import { nullPageController } from './controllers/null-page.js';
import { propertySetValueController } from './controllers/property-set-value.js';
import { reportSaveController } from './controllers/reports/report-save.js';

process.title = 'Grovekit control';

runAsyncMain(async () => {

  const config = getConfigFromEnv(process.env);

  const db = await getDB(getDBOptsFromEnv(process.env));

  const logger = new Logger(getLoggerOptsFromEnv(process.env));

  const app: HonoInstance = new Hono();

  app.get('/favicon.ico', (ctx) => {
    return ctx.notFound();
  });


  // For some reason I can't comprehend, the root path passed to serveStatic()
  // must be relative to the CWD.
  // See https://www.npmjs.com/package/@hono/node-server#serve-static-middleware
  const staticRootPath = path.relative(
    process.cwd(),
    assets_path,
  );

  app.use('/assets/*', serveStatic({
    root: staticRootPath,
    rewriteRequestPath: path => path.slice(7),
  }));

  app.use('*', async (ctx, next) => {
    ctx.set('db', db);
    ctx.set('logger', logger);
    ctx.set('url', new URL(ctx.req.url));
    await next();
  });

  rootController(app);

  nullPageController(app);

  reportCSVController(app);
  reportListController(app);
  reportRenderController(app);
  reportSaveController(app);
  reportDeleteController(app);
  reportDetailsController(app);

  alertsController(app);

  deviceListController(app);
  deviceDetailController(app);
  deviceWithSelectedPropertiesController(app);

  propertySetValueController(app);


  const server = serve({
    fetch: app.fetch,
    port: config.http_bind_port,
    hostname: config.http_bind_addr,
  });

  server.on('listening', () => {
    logger.info('Listening on %s:%s', config.http_bind_addr, config.http_bind_port);
  });

});
