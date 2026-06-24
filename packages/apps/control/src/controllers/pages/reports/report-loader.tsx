
import { Page } from '../../../components/page.js';
import { HonoContext, HonoInstance, getMainMenuItems } from '../../../utils.js';
import { Main } from '../../../components/main.js';
import { selectReportById, selectReportProperties } from '@grovekit/database';
import { PartialReportParams } from '../../../components/reports/types.js';
import { ReportParams } from '../../../components/reports/types.js';
import { flattenReportParams } from './utils.js';
import { is, ValidationErrorItem } from '@deepkit/type';

export const reportLoaderController = (app: HonoInstance) => {

  const onReportLoaderRequest = async (ctx: HonoContext) => {

    const id = ctx.req.param('id')!;
    const db = ctx.get('db');
    const url = ctx.get('url');

    const report = await selectReportById(db, id);

    if (!report) {
      return ctx.html((
        <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
          <Main>
            <h1>Not Found</h1>
          </Main>
        </Page>
      ), 404);
    }

    const params: PartialReportParams = { opts: {}, series: [] };

    params.opts.mode = 'chart';
    params.opts.title = report.title;
    params.opts.height = '400px';
    params.opts.width = '100%';
    params.opts.from = report.from;
    params.opts.to = report.to;
    params.opts.timezone = report.timezone;
    params.opts.aggr_win = report.aggr_win;
    params.opts.save_on_apply = 'false';
    params.opts.autorefresh = 'false';
    params.opts.id = id;

    let report_property_order: number = 0;

    for (const property of await selectReportProperties(db, { report_id: report.id })) {
      params.series[report_property_order++] = {
        label: property.label,
        property_id: property.property_id,
        datatype: property.datatype,
        color: property.color,
        style: property.style,
        delete: 'false',
        aggr_op: property.aggr_op,
        aggr_unit: property.aggr_unit,
      };
    }

    let errors: ValidationErrorItem[] = [];

    if (!is<ReportParams>(params, undefined, errors)) {
      return ctx.html(
        <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
          <Main>
            <h1>Invalid params</h1>
            <pre>{JSON.stringify(errors, null, 2)}</pre>
          </Main>
        </Page>
      );
    }

    const redirect_url = new URL(url);
    redirect_url.pathname = `/reports/details`;
    redirect_url.search = '';
    flattenReportParams(redirect_url.searchParams, params);

    return ctx.redirect(redirect_url);

  };

  app.get('/reports/loader/:id', onReportLoaderRequest);
  app.post('/reports/loader/:id', onReportLoaderRequest);


};
