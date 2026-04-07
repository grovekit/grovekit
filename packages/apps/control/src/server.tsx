
import {assets_path, HonoInstance } from './utils.js';
import { runAsyncMain, Logger, getConfigFromEnv } from '@grovekit/utils';
import path from 'node:path';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static'
import { getDB, migrateToLatest } from '@grovekit/database';
import { initRootController } from './controllers/pages/root.js';
import { deviceListController } from './controllers/pages/device-list.js';
import { deviceDetailController } from './controllers/pages/device-details.js';
import { alertsController } from './controllers/pages/alerts.js';

import { reportListController } from './controllers/pages/reports/report-list.js';
import { reportDetailsController } from './controllers/pages/reports/report-details.js';
import { reportCSVController } from './controllers/pages/reports/report-csv.js';
import { reportRenderController } from './controllers/pages/reports/report-render.js';
import { initPropertiesWithSelectedModalController } from './controllers/modals/properties-with-selected.js';
import { initNullPageController } from './controllers/pages/null-page.js';
import { initPropertiesSetValueModalController } from './controllers/modals/properties-set-value.js';
import { HTTPException } from 'hono/http-exception';
import { initReportsDeleteModalController } from './controllers/modals/reports-delete.js';
import { initReportsSaveModalController } from './controllers/modals/reports-save.js';
import { reportLoaderController } from './controllers/pages/reports/report-loader.js';
import { datafeedController } from './controllers/pages/datafeed.js';
import { Client } from '@grovekit/homie-client';

process.title = 'Grovekit Control';

const config = getConfigFromEnv();

const logger = new Logger({ level: config.log_level })

const db = await getDB({
  hostname: config.db_hostname,
  database: config.db_database,
  username: config.db_username,
  password: config.db_password,
  port: config.db_port,
});

await migrateToLatest(db, logger);

const client = new Client({
  url: new URL(`mqtt://${config.broker_hostname}:${config.broker_port}`),
  version: config.broker_protocol,
  client_id: config.broker_clientid,
  username: config.broker_username,
  password: config.broker_password,
});

await client.connect();

const app: HonoInstance = new Hono();

app.get('/favicon.ico', (ctx) => {
  return ctx.notFound();
});

app.get('/health', (ctx) => {
  return ctx.json({ status: 'healthy' }, 200);
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
  ctx.set('client', client);
  await next();
});

initRootController(app);

initNullPageController(app);

reportCSVController(app);
reportListController(app);
reportRenderController(app);
reportLoaderController(app);
reportDetailsController(app);

alertsController(app);

deviceListController(app);
deviceDetailController(app);

datafeedController(app, client, db);

// MODALS

initReportsSaveModalController(app);
initReportsDeleteModalController(app);
initPropertiesSetValueModalController(app);
initPropertiesWithSelectedModalController(app);



app.onError((err, ctx) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return ctx.html(<>
    <html>
      <body>
        <h1>Error</h1>
        <pre>{err.stack ?? err.message ?? 'Unknown error'}</pre>
      </body>
    </html>
  </>, 500);
});


const server = serve({
  fetch: app.fetch,
  port: config.dash_bind_port,
  hostname: config.dash_bind_addr,
});

server.on('listening', () => {
  logger.info('Listening on %s:%s', config.dash_bind_addr, config.dash_bind_port);
});
