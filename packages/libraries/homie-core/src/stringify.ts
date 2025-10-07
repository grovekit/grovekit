
import { ParsedTopic, SerializedTopic } from "./topics.js";

export const stringify = (topic: ParsedTopic): SerializedTopic => {
  switch (topic.type) {
    case 'device_state':
      return `${topic.prefix}/5/${topic.device}/$state` as SerializedTopic;
    case 'device_info':
      return `${topic.prefix}/5/${topic.device}/$description` as SerializedTopic;
    case 'device_alert':
      return `${topic.prefix}/5/${topic.device}/$alert/${topic.alert_id}` as SerializedTopic;
    case 'device_log':
      return `${topic.prefix}/5/${topic.device}/$log/${topic.log_level}` as SerializedTopic;
    case 'property_set':
      return `${topic.prefix}/5/${topic.device}/${topic.node}/${topic.property}/set` as SerializedTopic;
    case 'property_value':
      return `${topic.prefix}/5/${topic.device}/${topic.node}/${topic.property}` as SerializedTopic;
    case 'property_target':
      return `${topic.prefix}/5/${topic.device}/${topic.node}/${topic.property}/$target` as SerializedTopic;
    default:
      throw new Error('unknown topic type');
  }
};
