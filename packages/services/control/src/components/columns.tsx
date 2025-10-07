
import { FC, Child } from 'hono/jsx';

export interface ColumnsLayoutProps {
  columns: {
    maxWidth?: string;
    width?: string;
    flexGrow?: number
    content: Child;
  }[];
}

export const ColumnsLayout: FC<ColumnsLayoutProps> = (props) => {
  return (
    <div class="q-columns-layout">
      {props.columns.map(c => (
        <div class="q-layout-column" style={{ maxWidth: c.maxWidth, width: c.width, flexGrow: c.flexGrow }}>
          { c.content }
        </div>
      ))}
    </div>
  );
};
