
import {
  GeneratedAlways,
  Insertable,
  Updateable,
  Selectable,
} from "kysely";

import {
  ensureTrx,
  DB,
} from "../client.js";

import {
  AggregationOp,
  AggregationUnit,
  AggregationWindow,
} from "../services/multifeed.js";

import {
  NegativeTimeDeltaString,
  NowDatetimeString,
  ZonedDatetimeString,
} from "@grovekit/utils";

import {
  SelectableProperty,
} from "./properties.js";

export const SERIES_STYLES = ['line', 'dots'] as const;

export type SeriesStyle = (typeof SERIES_STYLES)[number];

export const REPORT_TYPES = ['table', 'chart'] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export interface Report {
  id: string;
  title: string;
  timezone: string;
  from: ZonedDatetimeString | NegativeTimeDeltaString;
  to: ZonedDatetimeString | NegativeTimeDeltaString | 'now';
  aggr_win: 'none' | AggregationWindow;
}

export type SelectableReport = Selectable<Report>;
export type InsertableReport = Insertable<Report>;
export type UpdateableReport = Updateable<Report>;

export interface ReportProperty {
  id: GeneratedAlways<number>;
  label: string;
  order: number;
  report_id: string;
  property_id: string;
  color: string;
  style: typeof SERIES_STYLES[number];
  aggr_op: AggregationOp;
  aggr_unit: AggregationUnit;
}

export type SelectableReportProperty = Selectable<ReportProperty>;
export type InsertableReportProperty = Insertable<ReportProperty>;
export type UpdateableReportProperty = Updateable<ReportProperty>;

export type ExtendedSelectableReportProperty = SelectableReportProperty & Pick<SelectableProperty, 'value_fid' | 'set_fid' | 'target_fid' | 'datatype'>;

export const selectReports = async (db: DB): Promise<SelectableReport[]> => {
  return await db.selectFrom('reports')
    .selectAll()
    .execute();
};

export const selectReportById = async (db: DB, id: string): Promise<SelectableReport | undefined> => {
  return await db.selectFrom('reports')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

export const deleteReportById = async (db: DB, id: string): Promise<SelectableReport> => {
  return await db.deleteFrom('reports')
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const insertReport = async (db: DB, report: InsertableReport): Promise<SelectableReport> => {
  return await db.insertInto('reports')
    .values(report)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const updateReportById = async (db: DB, id: string, patch: Omit<UpdateableReport, 'id'>): Promise<SelectableReport> => {
  return await db.updateTable('reports')
    .set(patch)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
};


export interface SelectReportPropertyOpts {
  report_id?: string;
  property_id?: string;
}

const getSelectReportPropertiesQuery = (db: DB, opts: SelectReportPropertyOpts) => {
  let query = db.selectFrom('report_properties as rp')
    .innerJoin('properties as p', 'rp.property_id', 'p.id')
    .selectAll('rp')
    .select(['p.set_fid', 'p.value_fid', 'p.target_fid', 'p.datatype'])
    .orderBy('rp.order', 'asc');
  if (opts?.report_id) {
    query = query.where('report_id', '=', opts.report_id);
  }
  if (opts?.property_id) {
    query = query.where('property_id', '=', opts.property_id);
  }
  return query;
};


export const countReportProperties = async (db: DB, opts: SelectReportPropertyOpts): Promise<number> => {
  const { count } = await getSelectReportPropertiesQuery(db, opts)
    .clearSelect()
    .select(eb => eb.fn.countAll('rp').as('count'))
    .executeTakeFirstOrThrow();
  return count as number;
};

export const selectReportProperties = async (db: DB, opts: SelectReportPropertyOpts): Promise<ExtendedSelectableReportProperty[]> => {
  return await getSelectReportPropertiesQuery(db, opts).execute();
};

export const selectReportPropertyById = async (db: DB, id: number): Promise<ExtendedSelectableReportProperty | undefined> => {
  return await getSelectReportPropertiesQuery(db, {})
    .where('rp.id', '=', id)
    .executeTakeFirst();
};

export const insertReportProperty = async (db: DB, property: InsertableReportProperty): Promise<SelectableReportProperty> => {
  return await db.insertInto('report_properties')
    .values(property)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const updateReportPropertyById = async (db: DB, id: number, patch: Omit<UpdateableReportProperty, 'id' | 'report_id' | 'property_id'>): Promise<SelectableReportProperty> => {
  delete (patch as any).id;
  delete (patch as any).report_id;
  delete (patch as any).property_id;
  return await db.updateTable('report_properties')
    .set(patch)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const updateReportPropertyByReportAndPropertyId = async (db: DB, report_id: string, property_id: string, patch: Omit<UpdateableReportProperty, 'id' | 'report_id' | 'property_id'>): Promise<SelectableReportProperty> => {
  delete (patch as any).id;
  delete (patch as any).report_id;
  delete (patch as any).property_id;
  return await db.updateTable('report_properties')
    .set(patch)
    .where('report_id', '=', report_id)
    .where('property_id', '=', property_id)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const deleteReportPropertiesByReportId = async (db: DB, report_id: string): Promise<void> => {
  await db.deleteFrom('report_properties')
    .where('report_id', '=', report_id)
    .execute();
};
