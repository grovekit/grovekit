
import { is } from "@deepkit/type";
import { ParsedTopic, WithRaw } from "./topics.js";
import { LOG_LEVEL } from "./enums.js";

export const parse = Object.assign((raw: string): WithRaw<ParsedTopic> | undefined => {
  parse.error = '';
  const [prefix, version, device, node, property, attribute] = raw.split('/');
  if (!prefix) {
    parse.error = 'invalid prefix segment';
    return;
  }
  if (!version) {
    parse.error = 'invalid version segment';
    return;
  }
  if (version !== '5') {
    parse.error = `unsupported version ${version}`;
    return;
  }
  if (!device) {
    parse.error = 'invalid device segment';
    return;
  }
  if (!node) {
    parse.error = 'invalid node segment';
    return;
  }
  if (node.charAt(0) === '$') {
    switch (node) {
      case '$state':
        return { raw, type: 'device_state', prefix, device };
      case '$description':
        return { raw, type: 'device_info', prefix, device };
      case '$log':
        if (is<LOG_LEVEL>(property)) {
          return { raw, type: 'device_log', prefix, device, log_level: property };
        }
        parse.error = 'invalid log level';
        return;
      case '$alert':
        if (property?.length > 0) {
          return { raw, type: 'device_alert', prefix, device, alert_id: property };
        }
        parse.error = 'invalid alert id';
        return;
      default:
        parse.error = 'invalid device attribute segment';
        return;
    }
  }
  if (!property) {
    parse.error = 'missing property segment';
    return;
  }
  if (property.charAt(0) === '$') {
    parse.error = 'invalid node attribute segment';
    return;
  }
  if (!attribute) {
    return { raw, type: 'property_value', prefix, device, node, property };
  }
  if (attribute.charAt(0) === '$') {
    if (attribute === '$target') {
      return { raw, type: 'property_target', prefix, device, node, property };
    } else {
      parse.error = 'invalid property attribute segment';
      return;
    }
  } else if (attribute === 'set') {
    return { raw, type: 'property_set', prefix, device, node, property };
  }
  parse.error = 'invalid topic';
  return;
}, { error: '' } as { error: string });
