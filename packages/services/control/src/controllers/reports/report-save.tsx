
import { HonoInstance } from '../../utils.js';
import { ensureTrx, insertReport, insertReportProperty } from '@grovekit/database';
import { unflattenReportParams } from './utils.js';
import { PartialReportParams, ReportParams } from '../../components/reports/types.js';
import { is, ValidationErrorItem } from '@deepkit/type';
import { mkId } from '@grovekit/utils';


export const reportSaveController = (app: HonoInstance) => {

  app.post('/reports/:id/save', async (ctx) => {

    const id = ctx.req.param('id');
    const db = ctx.get('db');
    const curr_url = ctx.get('url');

    const params: PartialReportParams = { opts: {}, series: [] };

    unflattenReportParams(params, Object.fromEntries(curr_url.searchParams));

    if (ctx.req.method === 'POST') {
      unflattenReportParams(params, await ctx.req.parseBody());
    }

    const errors: ValidationErrorItem[] = [];

    if (!is<ReportParams>(params, undefined, errors)) {
      return ctx.json({ errors });
    }

    const report = await ensureTrx(db, async (trx) => {
      const report = await insertReport(trx, {
        id: mkId(),
        title: params.opts.title,
        timezone: params.opts.timezone,
        from: params.opts.from,
        to: params.opts.to,
        aggr_win: params.opts.aggr_win,
      });
      let property_order = 0;
      await Promise.all(params.series.map(async (series) => {
        await insertReportProperty(trx, {
          report_id: report.id,
          order: property_order++,
          label: series.label,
          property_id: series.property_id,
          color: series.color,
          style: series.style,
          aggr_op: series.aggr_op,
          aggr_unit: series.aggr_unit,
        });
      }));
      return report;
    });

    return ctx.redirect(`/reports/${report.id}`);
  });

};
