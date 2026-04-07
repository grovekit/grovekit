
import { Page } from '../../components/page.js';
import { HonoContext, HonoInstance, getMainMenuItems, getDeviceMenuItems } from '../../utils.js';
import { SelectableDevice, selectDeviceById, selectPropertyById } from '@grovekit/database';
import { Main } from '../../components/main.js';
import { presentDeviceInfoAndProperties } from './device-details/device-info-properties.js';
import { presentDeviceAlerts } from './device-details/device-alerts.js';
import { presentDeviceLogs } from './device-details/device-logs.js';


const getDeviceAndContinue = async (ctx: HonoContext, device_id: string, next: (device: SelectableDevice) => Promise<Response>): Promise<Response> => {
  const device = await selectDeviceById(ctx.get('db'), device_id);
  if (!device) {
    return ctx.html(
      <Page title="not found" menu={{ items: getMainMenuItems(ctx) }}>
        <h1>Not found</h1>
      </Page>
    );
  }
  return await next(device);
};


export const deviceDetailController = (app: HonoInstance) => {

  app.get('/devices/:id', async (ctx) => {
    const { id } = ctx.req.param();
    return getDeviceAndContinue(ctx, id, async (device) => {
      const content = await presentDeviceInfoAndProperties(ctx, device);
      return ctx.html(
        <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
          <Main title={device.name ?? device.homie_id} subtitle="info" menu={{ items: getDeviceMenuItems(ctx, device) }}>
            { content }
          </Main>
        </Page>
      );
    });
  });

  app.get('/devices/:id/logs', async (ctx) => {
    const { id } = ctx.req.param();
    return getDeviceAndContinue(ctx, id, async (device) => {
      const content = await presentDeviceLogs(ctx, device);
      return ctx.html(
        <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
          <Main title={device.name ?? device.homie_id} subtitle="logs" menu={{ items: getDeviceMenuItems(ctx, device) }}>
            { content }
          </Main>
        </Page>
      );
    });
  });

  app.get('/devices/:id/alerts', async (ctx) => {
    const { id } = ctx.req.param();
    return getDeviceAndContinue(ctx, id, async (device) => {
      const content = await presentDeviceAlerts(ctx, device);
      return ctx.html(
        <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
          <Main title={device.name ?? device.homie_id} subtitle="Alerts" menu={{ items: getDeviceMenuItems(ctx, device) }}>
            { content }
          </Main>
        </Page>
      );
    });
  });

};
