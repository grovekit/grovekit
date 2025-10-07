
import { LOG_LEVEL } from "./enums.js";

export interface BaseTopic {
  type: `device_${'state' | 'info' | 'log' | 'alert'}` | `property_${'set' | 'value' | 'target'}`;
  device: string;
  prefix: string;
}

export interface DeviceStateTopic extends BaseTopic {
  type: 'device_state';
}

export interface DeviceInfoTopic extends BaseTopic {
  type: 'device_info';
}

export interface DeviceAlertTopic extends BaseTopic {
  type: 'device_alert';
  alert_id: string;
}

export interface DeviceLogTopic extends BaseTopic {
  type: 'device_log';
  log_level: LOG_LEVEL;
}

export type DeviceTopic = DeviceStateTopic | DeviceInfoTopic | DeviceAlertTopic | DeviceLogTopic;

export interface PropertySetTopic extends BaseTopic {
  type: 'property_set';
  node: string;
  property: string;
}

export interface PropertyValueTopic extends BaseTopic {
  type: 'property_value';
  node: string;
  property: string;
}

export interface PropertyTargetTopic extends BaseTopic {
  type: 'property_target';
  node: string;
  property: string;
}

export type PropertyTopic = PropertySetTopic | PropertyValueTopic | PropertyTargetTopic;

export type ParsedTopic = DeviceTopic | PropertyTopic;

export type SerializedTopic = string & { __topic: true };

export type WithRaw<T extends ParsedTopic> = T & { raw: string };
