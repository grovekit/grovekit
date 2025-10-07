
import { Device } from './devices.js';
import { Node } from './nodes.js';
import { Property } from './properties.js';
import { Feed } from './feeds.js';
import { DeviceLog } from './device-logs.js';
import { DeviceAlert } from './device-alerts.js';
import { Report, ReportProperty } from './reports.js';

import {
  type DatapointFloat,
  type DatapointInteger,
  type DatapointBoolean,
  type DatapointEnum,
  type DatapointJson,
  type DatapointString,
} from './datapoints.js';

export interface Tables {
  devices: Device;
  device_logs: DeviceLog;
  device_alerts: DeviceAlert;
  nodes: Node;
  properties: Property;
  feeds: Feed;
  reports: Report;
  report_properties: ReportProperty;
  datapoints_integer: DatapointInteger;
  datapoints_float: DatapointFloat;
  datapoints_bool: DatapointBoolean;
  datapoints_enum: DatapointEnum;
  datapoints_json: DatapointJson;
  datapoints_string: DatapointString;
}
