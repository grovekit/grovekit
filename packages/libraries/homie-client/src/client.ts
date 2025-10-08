
import Debug from 'debug';

import {
  TOPIC,
  RawValue,
  DeviceDescription,
  LOG_LEVEL,
  DeviceInfoTopic,
  DeviceStateTopic,
  DeviceAlertTopic,
  DeviceLogTopic,
  PropertyTargetTopic,
  PropertyValueTopic,
  PropertySetTopic,
  WithRaw,
  getDeviceWildcardTopic,
  getAutodiscoveryTopic,
  DEVICE_STATE,
} from '@grovekit/homie-core';

import { TcpClient } from '@seriousme/opifex/tcpClient';
import { ConnectParameters } from '@seriousme/opifex/client';
import { PublishPacket } from '@seriousme/opifex/mqttPacket';

import { AsyncIteratorConsumer } from './asynciterators.js';

import { is } from '@deepkit/type';
import { HomieClientOpts } from './config.js';

const debug = Debug('grove:homie:client');

export class HomieClient {

  #opts: ConnectParameters;
  #client: TcpClient;
  #subscriptions: Set<string>;

  onConnected: () => void;
  onDisconnected: () => void;

  constructor(opts: HomieClientOpts) {
    this.#opts = { ...opts, url: new URL(opts.url) };
    this.#client = new TcpClient();
    this.#subscriptions = new Set();
    this.onConnected = () => { };
    this.onDisconnected = () => { };

    let consumer: AsyncIteratorConsumer<PublishPacket> | undefined;

    this.#client.onConnected = () => {
      console.log('connected');
      queueMicrotask(this.onConnected);
      consumer = new AsyncIteratorConsumer<PublishPacket>(
        this.#client.messages(),
        this.#handleMessage,
      );
    };

    this.#client.onDisconnected = () => {
      this.#subscriptions.clear();
      console.log('disconnected');
      queueMicrotask(this.onDisconnected);
      consumer?.stop();
      consumer = undefined;
    };
  }

  async init() {
    await this.#client.connect(this.#opts);
  }

  async #subscribe(topic: string, qos: 0 | 1 | 2 = 0) {
    await this.#client.subscribe({ subscriptions: [{ topicFilter: topic, qos }] });
  }

  async enableAutoDiscovery(prefix: string) {
    await this.#subscribe(getAutodiscoveryTopic(prefix));
  }

  async handleDeviceInfo(parsed: WithRaw<DeviceInfoTopic>,  info: DeviceDescription) {

  }

  async publishDeviceInfo(parsed: DeviceInfoTopic, info: DeviceDescription) {
    await this.#client.publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(JSON.stringify(info)),
      qos: 2,
      retain: true,
    });
  }

  async handleDeviceState(parsed: WithRaw<DeviceStateTopic>,  state: DEVICE_STATE) {

  }

  async publishDeviceState(parsed: DeviceStateTopic, state: DEVICE_STATE) {
    await this.#client.publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(state),
      qos: 2,
      retain: true,
    });
  }

  async handleDeviceAlert(parsed: WithRaw<DeviceAlertTopic>, message: string) {

  }

  async publishDeviceAlert(parsed: DeviceAlertTopic, message: string) {
    await this.#client.publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(message),
      qos: 0,
      retain: false,
    });
  }

  async handleDeviceLog(parsed: WithRaw<DeviceLogTopic>, message: string) {

  }

  async publishDeviceLog(parsed: DeviceLogTopic, message: string) {
    await this.#client.publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(message),
      qos: 0,
      retain: false,
    });
  }

  async handlePropertyTarget(parsed: WithRaw<PropertyTargetTopic>, target: RawValue) {

  }

  async publishPropertyTarget(parsed: PropertyTargetTopic, value: RawValue) {
    await this.#client.publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: 2,
      retain: true,
    });
  }

  async subscribeToPropertyTarget(parsed: PropertyTargetTopic) {
    await this.#client.subscribe({
      subscriptions: [
        {
          topicFilter: TOPIC.stringify(parsed),
          qos: 2,
        }
      ],
    });
  }

  async handlePropertyValue(parsed: WithRaw<PropertyValueTopic>, value: RawValue) {

  }

  async publishPropertyValue(parsed: PropertyValueTopic, value: RawValue) {
    await this.#client.publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: 2,
      retain: true,
    });
  }

  async subscribeToPropertyValue(parsed: PropertyValueTopic) {
    await this.#client.subscribe({
      subscriptions: [
        {
          topicFilter: TOPIC.stringify(parsed),
          qos: 2,
        }
      ],
    });
  }

  async handlePropertySet(parsed: WithRaw<PropertySetTopic>, value: RawValue) {

  }

  async publishPropertySet(parsed: PropertySetTopic, value: RawValue) {
    await this.#client.publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: 0,
      retain: false,
    });
  }

  async subscribeToPropertySet(parsed: PropertySetTopic) {
    await this.#client.subscribe({
      subscriptions: [
        {
          topicFilter: TOPIC.stringify(parsed),
          qos: 2,
        }
      ],
    });
  }

  #onError = (err: Error) => {
    console.error(err);
  };

  #handleMessage = async (packet: PublishPacket) => {
    const payload = Buffer.from(packet.payload).toString('utf8');
    const parsed_topic = TOPIC.parse(packet.topic);
    if (!parsed_topic){
      return;
    }
    debug(`handling new message of type ${parsed_topic.type}`);
    switch (parsed_topic.type) {
      case 'device_state': {
        if (is<DEVICE_STATE>(payload)) {
          const wildcard_topic = getDeviceWildcardTopic(parsed_topic);
          if (!this.#subscriptions.has(wildcard_topic)) {
            this.#subscriptions.add(wildcard_topic);
            await this.#subscribe(wildcard_topic);
          }
          await this.handleDeviceState(parsed_topic, payload)
            .catch(this.#onError);
        }
      } break;
      case 'device_info': {
        const parsed_payload = JSON.parse(payload);
        if (is<DeviceDescription>(parsed_payload)) {
          await this.handleDeviceInfo(parsed_topic, parsed_payload)
            .catch(this.#onError);
        }
      } break;
      case 'device_log': {
        await this.handleDeviceLog(parsed_topic, payload)
          .catch(this.#onError);
      } break;
      case 'device_alert': {
        await this.handleDeviceAlert(parsed_topic, payload)
          .catch(this.#onError);
      } break;
      case 'property_target': {
        await this.handlePropertyTarget(parsed_topic, payload as RawValue)
          .catch(this.#onError);
      } break;
      case 'property_set': {
        await this.handlePropertySet(parsed_topic, payload as RawValue)
          .catch(this.#onError);
      } break;
      case 'property_value': {
        await this.handlePropertyValue(parsed_topic, payload as RawValue)
          .catch(this.#onError);
      } break;
    }
    debug('message handled');
  };

}
