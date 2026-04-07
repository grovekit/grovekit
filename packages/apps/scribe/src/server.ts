
import { Client } from '@grovekit/homie-client';
import {
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
  migrateToLatest,
} from '@grovekit/database';
import { BatchDatapointIngestor } from './ingestor.js';
import { LRUCache } from 'lru-cache';
import { TypedJSON, getConfigFromEnv, Logger } from '@grovekit/utils';
import { RawValue } from '@grovekit/homie-core';

process.title = 'Grovekit Scribe';

const config = getConfigFromEnv();

const logger = new Logger({ level: config.log_level });

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

client.connect().then(() => {
  client.enableAutoDiscovery(config.homie_prefix);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});



client.handleDeviceInfo = async (parsed, info) => {
  logger.trace('device info %s %s', parsed.raw, () => JSON.stringify(info));
  await ingestDeviceInfo(db, parsed, info);
};

client.handleDeviceState = async (parsed, state) => {
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

const getDeviceByHomieId = async (homie_prefix: string, homie_id: string): Promise<SelectableDevice | undefined> => {
  const key = `${homie_prefix}:${homie_id}`;
  let match = devices.get(key);
  if (!match) {
    const device = await selectDeviceByHomieId(db, homie_prefix, homie_id);
    devices.set(key, (match = { device }), { ttl: 30_000 * 1 + Math.random() });
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

client.handlePropertyValue = async (parsed, value) => {
  logger.trace('property value %s %s', parsed.raw, value);
  await handleDatapoint(parsed.raw, FeedType.PROPERTY_VALUE, value);
};

client.handlePropertyTarget = async (parsed, value) => {
  logger.trace('property target %s %s', parsed.raw, value);
  await handleDatapoint(parsed.raw, FeedType.PROPERTY_TARGET, value);
};

client.handleDeviceLog = async (parsed, value) => {
  logger.trace('device log %s %s', parsed.raw, value);
  const device = await getDeviceByHomieId(parsed.prefix, parsed.device);
  if (device) {
    await insertDeviceLog(db, {
      device_id: device.id,
      level: parsed.log_level,
      message: value,
      logged_at: Date.now(),
    });
  }
};

client.handleDeviceAlert = async (parsed, value) => {
  logger.trace('device alert %s %s', parsed.raw, value);
  await ingestDeviceAlert(db, parsed, value);
};
