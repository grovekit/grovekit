
import { Page } from '../../components/page.js';
import { HonoContext, HonoInstance, getMainMenuItems } from '../../utils.js';
import { Main } from '../../components/main.js';
import { selectReportById, selectReportProperties } from '@grovekit/database/dist/tables/reports.js';
import { NULL_REPORT_ID, PartialReportParams } from '../../components/reports/types.js';
import { ReportParams } from '../../components/reports/types.js';
import { ColumnsLayout } from '../../components/columns.js';
import { Section } from '../../components/section.js';
import { indexBy, local_timezone, negTimeDeltaToDuration, toZonedDatetimeString } from '@grovekit/utils';
import { selectPropertiesByIds } from '@grovekit/database';
import { flattenReportParams, unflattenReportParams } from './utils.js';
import { Frame } from '../../components/frame.js';
import { is, validate, ValidationErrorItem } from '@deepkit/type';
import { sub } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { collectReportData, collectReportDataColumnar, collectReportDataCSV } from './utils.js';
import { ensureTrx, updateReportOpts } from '@grovekit/database';
import { ReportChart, CHART_SCRIPTS, CHART_STYLES } from '../../components/reports/chart.js';
import { ReportForm } from '../../components/reports/form.js';
import { Child } from 'hono/jsx';
import { ReportCSVPre } from '../../components/reports/csvpre.js';
import { AutoResizingIframe } from '../../components/iframe.js';



export const reportDetailsController = (app: HonoInstance) => {

  const onReportDetailsRequest = async (ctx: HonoContext) => {

    const db = ctx.get('db');
    const curr_url = ctx.get('url');
    const report_id = ctx.req.param('id');

    const now = Date.now();

    const params: PartialReportParams = { opts: {}, series: [] };

    if (report_id !== NULL_REPORT_ID) {
      const report = await selectReportById(db, report_id);
      if (report) {
        params.opts.mode = 'chart';
        params.opts.title = report.title;
        params.opts.height = '400px';
        params.opts.width = '100%';
        params.opts.from = report.from;
        params.opts.to = report.to;
        params.opts.timezone = report.timezone;
        params.opts.aggr_win = report.aggr_win;
        params.opts.save_on_apply = 'false';

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

      }
    }

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

    const save_url = new URL(curr_url);
    save_url.pathname = `/reports/${report_id}/save`;
    flattenReportParams(save_url.searchParams, params);

    const delete_url = new URL(curr_url);
    delete_url.pathname = `/reports/${report_id}/delete`;

    const sidebar = (<>
      { report_id === NULL_REPORT_ID && (
        <Section title="Save report">
          <form action={save_url.toString()} method="post">
            <input type="text" name="title" value="" />
            <button type="submit">Save</button>
          </form>
        </Section>
      ) }
      { report_id !== NULL_REPORT_ID && (
        <Section title="Delete report">
          <form action={delete_url.toString()} method="post">
            <label>Are you sure? <input type="checkbox" name="confirm" /></label>
            <button type="submit">Delete</button>
          </form>
        </Section>
      ) }
    </>);

    const { opts, series } = params;

    if (report_id !== NULL_REPORT_ID && opts.save_on_apply === 'true') {
      const report = await selectReportById(ctx.get('db'), report_id);
      if (report) {
        await updateReportOpts(ctx.get('db'), report.id, opts, series);
      }
    }

    const as_chart_url = new URL(curr_url);
    flattenReportParams(as_chart_url.searchParams, params);
    as_chart_url.searchParams.set('mode', 'chart');

    const as_raw_url = new URL(curr_url);
    flattenReportParams(as_raw_url.searchParams, params);
    as_raw_url.searchParams.set('mode', 'raw');

    const as_csv_url = new URL(curr_url);
    flattenReportParams(as_csv_url.searchParams, params);
    as_csv_url.pathname = '/reports/csv';

    const render_url = new URL(curr_url);
    flattenReportParams(render_url.searchParams, params);
    render_url.pathname = '/reports/render';



    const dataviz = (
      <>

        <AutoResizingIframe src={render_url.toString()} />

        <ul class="q-inline-list" style={{ justifyContent: 'right' }}>
          { opts.mode === 'chart' && (
            <li><a href={as_raw_url.toString()}>view data</a></li>
          ) }
          { opts.mode === 'raw' && (
            <li><a href={as_chart_url.toString()}>view chart</a></li>
          ) }
          <li><a target="_blank" href={curr_url.toString()}>pop out</a></li>
          <li><a target="_blank" href={as_csv_url.toString()}>download as .csv</a></li>
        </ul>

        <ReportForm params={params} curr_url={curr_url} report_id={report_id} />
      </>
    );

    return ctx.html(
      <Page title="report details" menu={{ items: getMainMenuItems(ctx) }}>
        <Main title={params.opts.title}>
          <ColumnsLayout columns={[
            { content: sidebar, flexGrow: 1 },
            { content: dataviz, flexGrow: 4 },
          ]}  />
        </Main>
      </Page>
    );


  };

  app.get('/reports/:id', onReportDetailsRequest);
  app.post('/reports/:id', onReportDetailsRequest);

};
