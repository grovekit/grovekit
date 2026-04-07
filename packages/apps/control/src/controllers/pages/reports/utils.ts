
import { indexBy } from "@grovekit/utils";

import {
  ReportOpts,
  ReportSeriesOpts,
  ReportParams,
  PartialReportParams,
} from '../../../components/reports/types.js';

import {
  queryMultiFeed,
  queryMultiFeedColumnar,
  queryMultiFeedWithAggregation,
  queryMultiFeedWithAggregationColumnar,
  selectPropertyById,
  selectPropertiesByIds,
  DB,
  FeedOpts,
  FeedOptsWithAggr,
  MultiFeed,
  MultiFeedColumnar,
} from '@grovekit/database';

import { sub } from 'date-fns';

import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import {
  isNegTimeDeltaString,
  negTimeDeltaToDuration,
  toZonedDatetimeString,
} from '@grovekit/utils';

import { stringify } from 'csv-stringify/sync';
import { is, ValidationErrorItem } from "@deepkit/type";
import assert from "node:assert";


const calcTimeRangeFromOpts = (opts: ReportOpts): [from: number, to: number] => {
  const { from, to, timezone } = opts;
  let _to: number;
  let _from: number;
  const now = Date.now();
  if (to === 'now') {
    _to = now;
  } else if (isNegTimeDeltaString(to)) {
    _to = sub(now, negTimeDeltaToDuration(to)).valueOf();
  } else {
    _to = fromZonedTime(to, timezone).valueOf();
  }
  if (isNegTimeDeltaString(from)) {
    _from = sub(_to, negTimeDeltaToDuration(from)).valueOf();
  } else {
    _from = fromZonedTime(from, timezone).valueOf();
  }
  assert(typeof _from === 'number' && !Number.isNaN(_from), `failed to convert ${from} to a millistamp: ${_from}`);
  assert(typeof _to === 'number' && !Number.isNaN(_to), `failed to convert ${to} to a millistamp: ${_to}`);
  return [_from, _to];
};

const seriesToFeedOpts = async (db: DB, series: ReportSeriesOpts[]): Promise<(FeedOpts | FeedOptsWithAggr)[]> => {
  const properties = await selectPropertiesByIds(db, series.map(s => s.property_id));
  return properties.map((p, i) => ({ ...series[i], feed_id: p.value_fid, datatype: p.datatype }));
};

export const collectReportData = async (db: DB, params: ReportParams): Promise<MultiFeed[]> => {
  const { opts, series } = params;
  const [from, to] = calcTimeRangeFromOpts(opts);
  const feed_opts = await seriesToFeedOpts(db, series);
  const data = opts.aggr_win !== 'none'
    ? await queryMultiFeedWithAggregation(db, from, to, 'asc', opts.aggr_win, feed_opts as FeedOptsWithAggr[])
    : await queryMultiFeed(db, from, to, 'asc', feed_opts);
  return data;
};

export const collectReportDataTSV = async (db: DB, params: ReportParams, tabSize: number): Promise<string | null> => {

  const { opts, series } = params;

  const data = await collectReportData(db, params);

  data.unshift({
    // @ts-ignore
    t: 'Time'.padEnd(19, ' '),
    ...series.reduce((acc, s, i) => ({ ...acc, [`v${i + 1}`]: s.label }), {})
  });

  const lengths = series.map((s, i) => s.label.length);

  data.slice(1).forEach(d => {
    (d as any).t = toZonedDatetimeString(d.t, opts.timezone);
    series.forEach((_, i) => {
      const string_value = (d[`v${i + 1}`] = String(d[`v${i + 1}`]));
      lengths[i] = Math.max(lengths[i], string_value.length);
    });
  });

  let output = '';

  data.forEach(d => {
    output += `${d.t}\t`;
    series.forEach((_, i) => {
      const string_value = d[`v${i + 1}`] as string;
      output += `${d[`v${i + 1}`]}${''.padEnd(Math.floor((lengths[i] - string_value.length) / tabSize) + 1, '\t')}`;
    });
    output += '\n';
  });

  return output;
};

export const collectReportDataCSV = async (db: DB, params: ReportParams): Promise<string | null> => {
  const { opts, series } = params;
  const data = await collectReportData(db, params);
  data.forEach(d => { (d as any).t = toZonedDatetimeString(d.t, opts.timezone) });
  if (data.length) {
    return stringify(data, {
      header: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      columns: [
        { key: 't', header: 'time' },
        ...series.map((s, i) => ({ key: `v${i + 1}`, header: s.label })),
      ],
    });
  }
  return '';
};

export const collectReportDataColumnar = async (db: DB, params: ReportParams): Promise<MultiFeedColumnar> => {
  const { opts, series  } = params;
  const [from, to] = calcTimeRangeFromOpts(opts);
  const feed_opts = await seriesToFeedOpts(db, series);
  const data = opts.aggr_win !== 'none'
    ? await queryMultiFeedWithAggregationColumnar(db, from, to, 'asc', opts.aggr_win, feed_opts as FeedOptsWithAggr[])
    : await queryMultiFeedColumnar(db, from, to, 'asc', feed_opts);
  return data;
};

export const flattenReportParams = (urlparams: URLSearchParams, params: ReportParams) => {
  const { opts, series } = params;
  urlparams.set('id', opts.id);
  urlparams.set('mode', opts.mode);
  urlparams.set('height', opts.height);
  urlparams.set('width', opts.width);
  urlparams.set('timezone', opts.timezone);
  urlparams.set('autorefresh', opts.autorefresh);
  urlparams.set('title', opts.title);
  urlparams.set('from', opts.from);
  urlparams.set('to', opts.to);
  urlparams.set('aggr_win', opts.aggr_win);
  urlparams.set('save_on_apply', opts.save_on_apply);
  series.forEach((series, index) => {
    urlparams.set(`series.${index}.label`, series.label);
    urlparams.set(`series.${index}.datatype`, series.datatype);
    urlparams.set(`series.${index}.color`, series.color);
    urlparams.set(`series.${index}.style`, series.style);
    urlparams.set(`series.${index}.delete`, series.delete);
    urlparams.set(`series.${index}.property_id`, series.property_id);
    urlparams.set(`series.${index}.aggr_op`, series.aggr_op);
    urlparams.set(`series.${index}.aggr_unit`, series.aggr_unit);
  });
};

export const unflattenReportParams = (partial: PartialReportParams, flat: Record<string, string>) => {
  const { opts, series } = partial;
  Object.entries(flat).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    switch (key) {
      case 'id':
      case 'height':
      case 'width':
      case 'timezone':
      case 'title':
      case 'from':
      case 'to':
      case 'autorefresh':
      case 'mode':
      case 'aggr_win':
      case 'save_on_apply':
        opts[key] = value;
        break;
      default:
        if (key.startsWith('series.')) {
          const [_, index, prop] = key.split('.');
          const index_num = parseInt(index);
          if (!series[index_num]) {
            series[index_num] = {};
          }
          series[index_num][prop] = value;
        }
    }
  });
};
