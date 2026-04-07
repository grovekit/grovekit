import { FC } from "hono/jsx";

export interface MetadataListProps {
  items: { label: string, value: string }[];
}

export const MetadataList: FC<MetadataListProps> = (props) => {
  return (
    <dl class="q-metadata-list">
      {props.items.map(i => (
        <div class="q-dg">
          <dt>{i.label}</dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
};
