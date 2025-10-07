
import { resolve } from 'node:path';
import {
  HomieRootDevice,
  HomieClientOpts,
  Device,
  Node,
  DeviceInfo,
  FloatProperty,
} from '@grovekit/homie-client';
import { LOG_LEVEL } from '@grovekit/homie-core';
import { wait } from './utils.js';
import { LoopyLoop } from 'loopyloop';
import pinetto from 'pinetto';
import { is } from '@deepkit/type';
import { DevicesPayload, PowerflowPayload } from './types.js';
import { getHomieClientOptsFromEnv } from '@grovekit/homie-client';

process.title = 'grovekit gateway';

const base_url = 'http://192.168.1.11';

const logger = pinetto({ level: 'trace' })

const froniusFetch = async <T>(url: URL): Promise<{} | undefined> => {
  try {
    console.log('FETCHING', url);
    const res = await fetch(url);
    if (res.status === 200) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.log('FETCH failed', err);
    throw err;
  }
  return undefined;
};

const fetchDevices = async (base_url: string): Promise<DevicesPayload | undefined> => {
  const devices_url = new URL(base_url);
  devices_url.pathname = resolve(devices_url.pathname, 'status', 'devices');
  const data = await froniusFetch(devices_url);
  if (is<DevicesPayload>(data)) {
    return data;
  }
  return undefined;
};

const fetchPowerflow = async (base_url: string): Promise<PowerflowPayload | undefined> => {
  const powerflow_url = new URL(base_url);
  powerflow_url.pathname = resolve(powerflow_url.pathname, 'status', 'powerflow');
  const data = await froniusFetch(powerflow_url);
  if (is<PowerflowPayload>(data)) {
    console.log('VALID DATA');
    return data;
  }
  console.log('INVALID DATA');
  return undefined;
};

const opts: HomieClientOpts = {
  ...getHomieClientOptsFromEnv(process.env),
  options: {
    protocolLevel: 3,
    keepAlive: 1000,
  }
};

class FroniusGateway extends HomieRootDevice {

  readonly powerflow: Node;

  readonly p_akku: FloatProperty;
  readonly p_grid: FloatProperty;
  readonly p_load: FloatProperty;
  readonly p_pv: FloatProperty;

  constructor(id: string, opts: HomieClientOpts) {

    const info: DeviceInfo = {
      name: 'Fronius Gateway',
      type: 'gateway',
      homie: '5.0',
      version: 1,
    };

    super(id, info, opts);

    this.powerflow = this.addNode('powerflow', {
      name: 'Power Flow',
      type: 'powerflow',
    });

    this.p_akku = this.powerflow.addFloatProperty('P_Akku', {
      name: 'Power - Accumulator',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_grid = this.powerflow.addFloatProperty('P_Grid', {
      name: 'Power - Grid',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_load = this.powerflow.addFloatProperty('P_Load', {
      name: 'Power - Load',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

    this.p_pv = this.powerflow.addFloatProperty('P_PV', {
      name: 'Power - PV',
      unit: 'W',
      settable: false,
      retained: true,
    }, 0);

  }
}

let gateway: FroniusGateway;

let nextAlertDate = new Date(Date.now() + 15_000);
let currAlertId = 0;

const control_loop = new LoopyLoop(async () => {

  await wait(1000);

  if (!gateway) {
    const devices = await fetchDevices(base_url);
    if (devices) {
      for (const device of devices) {
        if (device.id) {
          gateway = new FroniusGateway(`fronius-${device.id}`, opts);
          await gateway.ready();
          break;
        }
      }
    }
  }

  if (gateway) {

    const powerflow = await fetchPowerflow(base_url);

    if (!powerflow || !powerflow.site) {
      return await wait(60_000);
    }

    const { site } = powerflow;

    const promises: Promise<any>[] = [];

    if (typeof site.P_Grid === 'number') {
      promises.push(gateway.p_grid.setValue(site.P_Grid));
    }

    if (typeof site.P_Load === 'number') {
      promises.push(gateway.p_load.setValue(site.P_Load));
    }

    if (typeof site.P_PV === 'number') {
      promises.push(gateway.p_pv.setValue(site.P_PV));
    }

    if (typeof site.P_Akku === 'number') {
      promises.push(gateway.p_akku.setValue(site.P_Akku));
    }

    console.log('BEFORE PUBLISH');
    await Promise.all(promises);
    console.log('AFTER PUBLISH');

  }

  console.log('done');
  await gateway.log(LOG_LEVEL.INFO, 'Control loop executed');

  const now = new Date();
  if (now > nextAlertDate) {
    nextAlertDate = new Date(now.getTime() + 15_000);
    await gateway.clearAlert(String(currAlertId));
    await gateway.publishAlert(String(++currAlertId), 'new alert');
  }

});

control_loop.on('error', (err) => {
  logger.error('loop error %s', err.stack);
  control_loop.start();
});

control_loop.start();





// const info: DeviceInfo = {};

// const opts = {
//   host: '127.0.0.1',
//   port: 1884,
// };

// class FroniusGateway extends RootDevice {

//   constructor(info: DeviceInfo, opts: MqttClientOptions) {
//     super(info, opts);
//   }


// }


// const root = new RootDevice(info, opts);

// root.addNode(info)
