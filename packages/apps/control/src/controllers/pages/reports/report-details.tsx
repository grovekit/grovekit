
import { Page } from '../../../components/page.js';
import { HonoContext, HonoInstance, getMainMenuItems } from '../../../utils.js';
import { Main } from '../../../components/main.js';
import { selectReportById, selectReportProperties } from '@grovekit/database';
import { NULL_REPORT_ID, PartialReportParams } from '../../../components/reports/types.js';
import { ReportParams } from '../../../components/reports/types.js';
import { flattenReportParams, unflattenReportParams } from './utils.js';
import { is, ValidationErrorItem } from '@deepkit/type';
import { updateReportOpts } from '@grovekit/database';
import { ReportForm } from '../../../components/reports/form.js';
import { Iframe } from '../../../components/iframe.js';

export const reportDetailsController = (app: HonoInstance) => {

  const onReportDetailsRequest = async (ctx: HonoContext) => {

    const curr_url = ctx.get('url');

    const params: PartialReportParams = { opts: {}, series: [] };

    unflattenReportParams(params, Object.fromEntries(curr_url.searchParams));

    if (ctx.req.method === 'POST') {
      unflattenReportParams(params, await ctx.req.parseBody());
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

    params.series = params.series.filter(s => s.delete === 'false') as ReportParams['series'];

    const { opts, series } = params;

    if (params.opts.id !== NULL_REPORT_ID && opts.save_on_apply === 'true') {
      const report = await selectReportById(ctx.get('db'), params.opts.id);
      if (report) {
        await updateReportOpts(ctx.get('db'), report.id, opts, series);
      }
    }

    const curr_url_with_params = new URL(curr_url);
    curr_url_with_params.search = '';
    flattenReportParams(curr_url_with_params.searchParams, params);

    const as_chart_url = new URL(curr_url_with_params);
    as_chart_url.searchParams.set('mode', 'chart');

    const as_raw_url = new URL(curr_url_with_params);
    as_raw_url.searchParams.set('mode', 'raw');

    const as_csv_url = new URL(curr_url_with_params);
    as_csv_url.pathname = '/reports/csv';

    const render_url = new URL(curr_url_with_params);
    render_url.pathname = '/reports/render';

    const save_url = new URL(curr_url_with_params);
    save_url.pathname = `/modals/reports/save`;

    const delete_url = new URL(curr_url_with_params);
    delete_url.pathname = `/modals/reports/delete/${params.opts.id}`;

    const dataviz = (
      <>

        <Iframe src={render_url.toString()} />

        <ul class="q-inline-list" style={{ justifyContent: 'right' }}>
          { opts.mode === 'chart' && (
            <li><a href={as_raw_url.toString()}>view data</a></li>
          ) }
          { opts.mode === 'raw' && (
            <li><a href={as_chart_url.toString()}>view chart</a></li>
          ) }
          <li><a target="_blank" href={curr_url_with_params.toString()}>pop out</a></li>
          <li><a target="_blank" href={as_csv_url.toString()}>download as .csv</a></li>
          { params.opts.id !== NULL_REPORT_ID && (
            <li><a href={delete_url.toString()} target="q-bottom-modal-iframe">delete report</a></li>
          )}
          { params.opts.id === NULL_REPORT_ID && (
            <li><a href={save_url.toString()} target="q-bottom-modal-iframe">save report</a></li>
          )}
        </ul>

        <ReportForm params={params} curr_url={curr_url_with_params} />
      </>
    );

    return ctx.html(
      <Page title="report details" menu={{ items: getMainMenuItems(ctx) }}>
        <Main title={params.opts.title}>
          {dataviz}
        </Main>
      </Page>
    );


  };

  app.get('/reports/details', onReportDetailsRequest);
  app.post('/reports/details', onReportDetailsRequest);

};
