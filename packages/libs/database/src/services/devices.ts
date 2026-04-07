
import { getPropertyFormat } from '@grovekit/homie-core';
import { ensureTrx, DB } from '../client.js';
import { insertDevice, selectDeviceByHomieId, updateDeviceById, SelectableDevice } from '../tables/devices.js';
import { FeedType, insertFeed, updateFeedById } from '../tables/feeds.js';
import { mkId, typedStringify } from '@grovekit/utils';
import { DEVICE_STATE, TOPIC, DeviceDescription, DeviceTopic } from '@grovekit/homie-core';
import { insertNode, selectNodeByDeviceAndHomieId, selectNodesByDeviceId, updateNodeById } from '../tables/nodes.js';
import { insertProperty, selectPropertyByNodeAndHomieId, updatePropertyById } from '../tables/properties.js';
import { insertDatapointString, insertDatapointJson } from '../tables/datapoints.js';


export const registerDevice = async (db: DB, topic: DeviceTopic, state?: DEVICE_STATE, info?: DeviceDescription): Promise<SelectableDevice> => {
  return await ensureTrx(db, async (trx) => {
    let device = await selectDeviceByHomieId(trx, topic.device);
    if (!device) {
      const state_feed = await insertFeed(trx, {
        type: FeedType.DEVICE_STATE,
        topic: TOPIC.stringify({ ...topic, type: 'device_state' }),
        datatype: 'string',
      });
      const info_feed = await insertFeed(trx, {
        type: FeedType.DEVICE_INFO,
        topic: TOPIC.stringify({ ...topic, type: 'device_info' }),
        datatype: 'json',
      });
      device = await insertDevice(trx, {
        id: mkId(),
        name: info?.name,
        type: info?.type,
        state: state,
        homie_id: topic.device,
        info_fid: info_feed.id,
        state_fid: state_feed.id,
        updated_at: Date.now(),
        open_alerts: 0,
        total_alerts: 0,
      });
    } else {
      const patch = {
        state,
        type: info?.type,
        name: info?.name,
        updated_at: Date.now(),
      };
      device = await updateDeviceById(trx, device.id, patch);
    }
    return device;
  });
};

export const registerDeviceNodesAndProperties = async (db: DB, topic: DeviceTopic, info: DeviceDescription): Promise<SelectableDevice> => {
  return await ensureTrx(db, async (trx) => {
    let device = await registerDevice(trx, topic, undefined, info);
    if (info.root) {
      const root = await selectDeviceByHomieId(trx, info.root);
      if (root) {
        device = await updateDeviceById(trx, device.id, { root_id: root.id });
      }
    }
    if (info.parent) {
      const parent = await selectDeviceByHomieId(trx, info.parent);
      if (parent) {
        device = await updateDeviceById(trx, device.id, { parent_id: parent.id });
      }
    }
    if (info.nodes) {
      for (const [node_h_id, node_info] of Object.entries(info.nodes)) {
        let node = await selectNodeByDeviceAndHomieId(trx, device.id, node_h_id);
        if (!node) {
          node = await insertNode(trx, {
            id: mkId(),
            name: node_info.name,
            device_id: device.id,
            homie_id: node_h_id,
            // h_info: typedStringify(node_info),
          });
        } else {
          node = await updateNodeById(trx, node.id, {
            name: node_info.name,
            // h_info: typedStringify(node_info)
          });
        }
        if (node_info.properties) {
          for (const [prop_h_id, prop_info] of Object.entries(node_info.properties)) {
            const format = getPropertyFormat(prop_info);
            let prop = await selectPropertyByNodeAndHomieId(trx, node.id, prop_h_id);
            if (!prop) {
              const set_feed = await insertFeed(trx, {
                type: FeedType.PROPERTY_SET,
                topic: TOPIC.stringify({ ...topic, type: 'property_set', node: node.homie_id, property: prop_h_id }),
                datatype: format.datatype,
              });
              const value_feed = await insertFeed(trx, {
                type: FeedType.PROPERTY_VALUE,
                topic: TOPIC.stringify({ ...topic, type: 'property_value', node: node.homie_id, property: prop_h_id }),
                datatype: format.datatype,
              });
              const target_feed = await insertFeed(trx, {
                type: FeedType.PROPERTY_TARGET,
                topic: TOPIC.stringify({ ...topic, type: 'property_target', node: node.homie_id, property: prop_h_id }),
                datatype: format.datatype,
              });
              prop = await insertProperty(trx, {
                id: mkId(),
                device_id: device.id,
                node_id: node.id,
                homie_id: prop_h_id,
                name: prop_info.name,
                // info: typedStringify(prop_info),
                set_fid: set_feed.id,
                value_fid: value_feed.id,
                target_fid: target_feed.id,
                unit: prop_info.unit,
                datatype: prop_info.datatype,
                settable: prop_info.settable ?? false,
                retained: prop_info.retained ?? false,
                format: typedStringify(format),
              });
            } else {
              await updatePropertyById(trx, prop.id, {
                // info: typedStringify(prop_info),
                name: prop_info.name,
                format: typedStringify(format),
                unit: prop_info.unit,
                datatype: prop_info.datatype,
                settable: prop_info.settable ?? false,
                retained: prop_info.retained ?? false,
              });
              await updateFeedById(trx, prop.set_fid, { datatype: format.datatype });
              await updateFeedById(trx, prop.value_fid, { datatype: format.datatype });
              await updateFeedById(trx, prop.target_fid, { datatype: format.datatype });
            }
          }
        }
      }
    }
    return device;
  });
};

export const ingestDeviceState = async (ks: DB, topic: DeviceTopic, state: DEVICE_STATE) => {
  await ensureTrx(ks, async (trx) => {
    const device = await registerDevice(trx, topic, state);
    await insertDatapointString(trx, { f: device.state_fid, t: Date.now(), v: state });
  });
};

export const ingestDeviceInfo = async (ks: DB, topic: DeviceTopic, info: DeviceDescription) => {
  await ensureTrx(ks, async (trx) => {
    const device = await registerDeviceNodesAndProperties(trx, topic, info);
    await insertDatapointJson(trx, { f: device.info_fid, t: Date.now(), v: typedStringify(info) });
  });
};
