
import {
  AggregationUnit,
  AggregationOp,
  AggregationWindow,
} from '@grovekit/database';
import type { Datatype } from '@grovekit/homie-core';

import {
  NegativeTimeDeltaString,
  ZonedDatetimeString,
} from '@grovekit/utils';

export type SeriesStyle = 'line' | 'dots';

export const SERIES_STYLES: SeriesStyle[] = ['line', 'dots'];

export type ReportMode = 'raw' | 'chart';

export const REPORT_MODES: ReportMode[] = ['raw', 'chart'];

export const NULL_REPORT_ID = 'null' as const;

export interface ReportSeriesOpts extends Record<string, string> {
  label: string;
  color: string;
  style: SeriesStyle;
  delete: 'true' | 'false';
  datatype: Datatype;
  property_id: string;
  aggr_op: AggregationOp;
  aggr_unit: AggregationUnit;
}

export interface ReportOpts extends Record<string, string> {
  mode: ReportMode;
  height: string;
  width: string;
  timezone: string;
  title: string;
  from: ZonedDatetimeString | NegativeTimeDeltaString;
  to: ZonedDatetimeString | NegativeTimeDeltaString | 'now';
  aggr_win: 'none' | AggregationWindow;
  save_on_apply: 'true' | 'false';
}

export interface ReportParams {
  opts: ReportOpts;
  series: [first: ReportSeriesOpts, ...rest: ReportSeriesOpts[]];
}

export interface PartialReportParams {
  opts: Record<string, string>;
  series: Record<string, string>[];
}
