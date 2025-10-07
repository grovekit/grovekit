
import { FC } from "hono/jsx";
import { ReportParams } from "./types.js";
import { MultiFeedColumnar } from "@grovekit/database";

export const CHART_STYLES = [
  '/assets/vendor/uPlot-1.6.30.min.css',
];

export const CHART_SCRIPTS = [
  '/assets/vendor/uPlot-1.6.30.iife.min.js',
  '/assets/scripts/chart.js',
];

export const ReportChart: FC<{ params: ReportParams, data: MultiFeedColumnar }> = (props) => {
  const { params: { opts, series }, data } = props;
  return (
    <script type="q-chart-json" dangerouslySetInnerHTML={{
      __html: JSON.stringify({ opts, series, data }),
    }} />
  );
};
