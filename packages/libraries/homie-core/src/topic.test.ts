
import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { parse } from './parse.js';
import { stringify } from './stringify.js';

describe('Topic', () => {

  describe('device topics', () => {

    it('should not parse a device topic without an attribute', () => {
      const topic = 'homie/5/device';
      const parsed = parse(topic);
      strictEqual(parsed, undefined);
      strictEqual(parse.error, 'invalid node segment');
    });

    it('should parse and serialize a device state topic', () => {
      const topic = 'homie/5/device/$state';
      const parsed = parse(topic);
      if (!parsed) throw new Error('invalid');
      strictEqual(parsed.raw, topic);
      strictEqual(parsed.type, 'device_state');
      strictEqual(parsed.prefix, 'homie');
      strictEqual(parsed.device, 'device');
      strictEqual(stringify(parsed), topic);
    });

    it('should parse and serialize a device description topic', () => {
      const topic = 'homie/5/device/$description';
      const parsed = parse(topic);
      if (!parsed) throw new Error('invalid');
      strictEqual(parsed.raw, topic);
      strictEqual(parsed.type, 'device_info');
      strictEqual(parsed.prefix, 'homie');
      strictEqual(parsed.device, 'device');
      strictEqual(stringify(parsed), topic);
    });

    it('should parse and serialize a device log topic', () => {
      const topic = 'homie/5/device/$log/info';
      const parsed = parse(topic);
      if (!parsed) throw new Error('invalid');
      strictEqual(parsed.raw, topic);
      strictEqual(parsed.type, 'device_log');
      strictEqual(parsed.prefix, 'homie');
      strictEqual(parsed.device, 'device');
      strictEqual(parsed.log_level, 'info');
      strictEqual(stringify(parsed), topic);
    });

    it('should parse and serialize a device alert topic', () => {
      const topic = 'homie/5/device/$alert/alert';
      const parsed = parse(topic);
      if (!parsed) throw new Error('invalid');
      strictEqual(parsed.raw, topic);
      strictEqual(parsed.type, 'device_alert');
      strictEqual(parsed.prefix, 'homie');
      strictEqual(parsed.device, 'device');
      strictEqual(parsed.alert_id, 'alert');
      strictEqual(stringify(parsed), topic);
    });

    it('should not parse a device topic with an unknown attribute', () => {
      const topic = 'homie/5/device/$unknown';
      const parsed = parse(topic);
      strictEqual(parsed, undefined);
      strictEqual(parse.error, 'invalid device attribute segment');
    });

  });

  describe('node topics', () => {

    it('should not parse a node topic', () => {
      const topic = 'homie/5/device/node';
      const parsed = parse(topic);
      strictEqual(parsed, undefined);
      strictEqual(parse.error, 'missing property segment');
    });

  });

  describe('property topics', () => {

    it('should parse and serialize a property value topic', () => {
      const topic = 'homie/5/device/node/property';
      const parsed = parse(topic);
      if (!parsed) throw new Error('invalid');
      strictEqual(parsed.raw, topic);
      strictEqual(parsed.type, 'property_value');
      strictEqual(parsed.prefix, 'homie');
      strictEqual(parsed.device, 'device');
      strictEqual(parsed.node, 'node');
      strictEqual(parsed.property, 'property');
      strictEqual(stringify(parsed), topic);
    });

    it('should not parse and serialize a property description topic', () => {
      const topic = 'homie/5/device/node/property/$description';
      const parsed = parse(topic);
      strictEqual(parsed, undefined);
      strictEqual(parse.error, 'invalid property attribute segment');
    });

    it('should parse and serialize a property target topic', () => {
      const topic = 'homie/5/device/node/property/$target';
      const parsed = parse(topic);
      if (!parsed) throw new Error('invalid');
      strictEqual(parsed.raw, topic);
      strictEqual(parsed.type, 'property_target');
      strictEqual(parsed.prefix, 'homie');
      strictEqual(parsed.device, 'device');
      strictEqual(parsed.node, 'node');
      strictEqual(parsed.property, 'property');
      strictEqual(stringify(parsed), topic);
    });

    it('should parse and serialize a property set topic', () => {
      const topic = 'homie/5/device/node/property/set';
      const parsed = parse(topic);
      if (!parsed) throw new Error('invalid');
      strictEqual(parsed.raw, topic);
      strictEqual(parsed.type, 'property_set');
      strictEqual(parsed.prefix, 'homie');
      strictEqual(parsed.device, 'device');
      strictEqual(parsed.node, 'node');
      strictEqual(parsed.property, 'property');
      strictEqual(stringify(parsed), topic);
    });

    it('should not parse a property topic with an unknown attribute', () => {
      const topic = 'homie/5/device/node/property/$unknown';
      const parsed = parse(topic);
      strictEqual(parsed, undefined);
      strictEqual(parse.error, 'invalid property attribute segment');
    });

  });



});
