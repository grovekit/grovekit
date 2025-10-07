
import { CSSProperties, FC } from "hono/jsx";
import { ReportParams } from "./types.js";

export interface ReportCSVPreProps {
  params: ReportParams
  data: string;
  style?: CSSProperties;
}

export const ReportCSVPre: FC<ReportCSVPreProps> = (props) => {
  const { params: { opts, series }, data } = props;
  return (
    <pre class="q-csv-pre">{data}</pre>
  );
};
