
import { HomieClient } from '@grovekit/homie-client';

import {
  getDBOptsFromEnv,
  ingestDeviceState,
  ingestDeviceInfo,
  insertDeviceLog,
  selectFeedByTypeAndTopic,
  FeedType,
  getDB,
  SelectableFeed,
  SelectableDevice,
  selectDeviceByHomieId,
  ingestDeviceAlert,
  subscribeToPropertySetRequests,
} from '@grovekit/database';
import { BatchDatapointIngestor } from './ingestor.js';
import pinetto from 'pinetto';
import { LRUCache } from 'lru-cache';
import { TypedJSON } from '@grovekit/utils';
import { TOPIC, RawValue } from '@grovekit/homie-core';
import { getHomieClientOptsFromEnv } from '@grovekit/homie-client';

process.title = 'Grovekit scribe';

const logger = pinetto({
  level: 'error',
});

const homie_client = new HomieClient({
  ...getHomieClientOptsFromEnv(process.env),
  options: {
    protocolLevel: 3,
  }
});

homie_client.init().then(() => {
  homie_client.enableAutoDiscovery('homie');
}).catch((err) => {
  console.error(err);
  process.exit(1);
})

const db = await getDB(getDBOptsFromEnv(process.env));

homie_client.handleDeviceInfo = async (parsed, info) => {
  logger.trace('device info %s %s', parsed.raw, () => JSON.stringify(info));
  await ingestDeviceInfo(db, parsed, info);
};

homie_client.handleDeviceState = async (parsed, state) => {
  logger.trace('device state %s %s', parsed.raw, state);
  await ingestDeviceState(db, parsed, state);
};

const feeds = new LRUCache<string, { feed?: SelectableFeed }>({
  ttl: 60_000,
  max: 10000,
});

const devices = new LRUCache<string, { device?: SelectableDevice }>({
  ttl: 60_000,
  max: 10000,
});

const getDeviceByHomieId = async (homie_id: string): Promise<SelectableDevice | undefined> => {
  let match = devices.get(homie_id);
  if (!match) {
    const device = await selectDeviceByHomieId(db, homie_id);
    devices.set(homie_id, (match = { device }), { ttl: 30_000 * 1 + Math.random() });
  }
  return match.device;
};

const getFeedByTypeAndTopic = async (type: FeedType, topic: string): Promise<SelectableFeed | undefined> => {
  let match = feeds.get(topic);
  if (!match) {
    const feed = await selectFeedByTypeAndTopic(db, type, topic);
    feeds.set(topic, (match = { feed }), { ttl: 30_000 * 1 + Math.random() });
  }
  return match.feed;
};

const ingestor = new BatchDatapointIngestor(db);

const handleDatapoint = async (topic: string, feed_type: FeedType, raw: RawValue) => {
  const feed = await getFeedByTypeAndTopic(feed_type, topic);
  switch (feed?.datatype) {
    case "string":
      await ingestor.string.addItem({ f: feed.id, t: Date.now(), v: raw });
      break;
    case "boolean": {
      if (raw === 'true' || raw === 'false') {
        await ingestor.boolean.addItem({ f: feed.id, t: Date.now(), v: Boolean(raw) });
      }
    } break;
    case "integer": {
      const as_number = parseInt(raw);
      if (!Number.isNaN(as_number)) {
        await ingestor.integer.addItem({ f: feed.id, t: Date.now(), v: as_number });
      }
    } break;
    case "float": {
      const as_number = parseFloat(raw);
      if (!Number.isNaN(as_number)) {
        await ingestor.float.addItem({ f: feed.id, t: Date.now(), v: as_number });
      }
    } break;
    case "enum":
      await ingestor.string.addItem({ f: feed.id, t: Date.now(), v: raw });
      break;
    case "color":
    case "datetime":
    case "duration":
    case "json":
      try {
        JSON.parse(raw);
        await ingestor.json.addItem({ f: feed.id, t: Date.now(), v: raw as unknown as TypedJSON<any> });
      } catch (error) {
        console.error('invalid json');
      }
      break;
  }
};

homie_client.handlePropertyValue = async (parsed, value) => {
  logger.trace('property value %s %s', parsed.raw, value);
  await handleDatapoint(parsed.raw, FeedType.PROPERTY_VALUE, value);
};

homie_client.handlePropertyTarget = async (parsed, value) => {
  logger.trace('property target %s %s', parsed.raw, value);
  await handleDatapoint(parsed.raw, FeedType.PROPERTY_TARGET, value);
};

homie_client.handleDeviceLog = async (parsed, value) => {
  logger.trace('device log %s %s', parsed.raw, value);
  const device = await getDeviceByHomieId(parsed.device);
  if (device) {
    await insertDeviceLog(db, {
      device_id: device.id,
      level: parsed.log_level,
      message: value,
      logged_at: Date.now(),
    });
  }
};

homie_client.handleDeviceAlert = async (parsed, value) => {
  logger.trace('device alert %s %s', parsed.raw, value);
  await ingestDeviceAlert(db, parsed.device, parsed.alert_id, value);
};

const subscription = await subscribeToPropertySetRequests(db, async (req) => {
  const { topic, value } = req;
  const parsed_topic = TOPIC.parse(topic);
  if (parsed_topic?.type === 'property_set') {
    console.log('YEEAAAAAh');
    await homie_client.publishPropertySet(parsed_topic, value);
  }

});
