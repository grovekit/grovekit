

import { ensureTrx, insertReport, insertReportProperty, removeReport, selectReportById } from "@grovekit/database";
import { HonoInstance } from "../../utils.js";
import { IframeModalPage } from "../../components/iframe.js";
import { unflattenReportParams } from "../pages/reports/utils.js";
import { PartialReportParams, ReportParams } from "../../components/reports/types.js";
import { ValidationErrorItem, is } from "@deepkit/type";
import { mkId } from "@grovekit/utils";

export const initReportsSaveModalController = (app: HonoInstance) => {

  app.use('/modals/reports/save', async (ctx, next) => {
    const curr_url = ctx.get('url');
    const params: PartialReportParams = { opts: {}, series: []};
    unflattenReportParams(params, Object.fromEntries(curr_url.searchParams));
    if (ctx.req.method === 'POST') {
      unflattenReportParams(params, await ctx.req.parseBody());
    }
    let errors: ValidationErrorItem[] = [];
    if (!is<ReportParams>(params, undefined, errors)) {
      return ctx.html(
        <IframeModalPage>
          <p>Invalid params</p>
          <pre>{JSON.stringify(errors, null, 2)}</pre>
        </IframeModalPage>
      );
    }
    ctx.set('report_params', params);
    return next();
  });

  app.get('/modals/reports/save', async (ctx) => {
    // const db = ctx.get('db');
    const curr_url = ctx.get('url');
    // const params = ctx.get('report_params') as ReportParams;
    return ctx.html(
      <IframeModalPage>
        <form method="post" action={curr_url.toString()}>
          <input type="text" name="title" />
          <button type="submit">Delete</button>
        </form>
      </IframeModalPage>
    );
  });

  app.post('/modals/reports/save', async (ctx) => {
    const db = ctx.get('db');
    const curr_url = ctx.req.url;
    const params = ctx.get('report_params') as ReportParams;
    // TODO: move to a service
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
    const redirect_url = new URL(curr_url);
    redirect_url.pathname = `/reports/loader/${report.id}`;
    redirect_url.search = '';
    return ctx.html(<IframeModalPage parent_redirect={redirect_url} />);
  });

};
