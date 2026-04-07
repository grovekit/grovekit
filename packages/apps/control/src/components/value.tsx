import { FC } from "hono/jsx";

export interface PropertyValueProps {
  topic: string;
  value: string;
}

export const PropertyValue: FC<PropertyValueProps> = (props) => {
  const { topic, value } = props;
  return (
    <span class="gk-property-value" topic={topic}>
      <span class="gk-property-value_value">{value}</span>
    </span>
  );
};
