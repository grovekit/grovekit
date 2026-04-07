
import { is, ValidationErrorItem, validate } from "@deepkit/type";
import { PartialReportParams, ReportParams } from "../../../components/reports/types.js";
import { collectReportDataTSV, unflattenReportParams } from "./utils.js";
import  { HonoContext, HonoInstance } from "../../../utils.js";
import { Child } from "hono/jsx";
import { collectReportDataColumnar, collectReportDataCSV } from "./utils.js";
import { ReportCSVPre } from "../../../components/reports/csvpre.js";
import { ReportChart, CHART_SCRIPTS, CHART_STYLES } from "../../../components/reports/chart.js";
import { Frame } from "../../../components/frame.js";
import { isNumericReport } from "../../../components/reports/utils.js";

export const reportRenderController = (app: HonoInstance) => {

  const onReportRenderReq = async (ctx: HonoContext) => {

    const db = ctx.get('db');
    const url = ctx.get('url');

    const params: PartialReportParams = { opts: {}, series: [] };

    unflattenReportParams(params, Object.fromEntries(url.searchParams));

    if (ctx.req.method === 'POST') {
      unflattenReportParams(params, await ctx.req.parseBody());
    }

    if (!is<ReportParams>(params)) {
      return ctx.html(
        <>
          <p>Invalid report parameters</p>
          <pre>{JSON.stringify(params, null, 2)}</pre>
        </>
      );
    }

    const { opts } = params;

    let render: Child;

    let styles: string[] = [];
    let scripts: string[] = [];

    if (opts.mode === 'chart' && isNumericReport(params.series)) {
      const data = await collectReportDataColumnar(db, params);
      if (data[0]?.length) {
        render = (<ReportChart params={params} data={data} />);
      } else {
        render = (<p>No data available</p>);
      }
      styles = CHART_STYLES;
      scripts = CHART_SCRIPTS;
    } else {
      const data = await collectReportDataTSV(db, params, 8);
      if (data) {
        render = (<ReportCSVPre params={params} data={data} style={{ tabSize: 8 }} />);
      } else {
        render = (<p>No data available</p>);
      }
    }

    return ctx.html(
      <Frame scripts={scripts} styles={styles} title={opts.title} refresh={opts.autorefresh === 'true' ? 5 : undefined}>
        {render}
      </Frame>
    );

  };

  app.get('/reports/render', onReportRenderReq);
  app.post('/reports/render', onReportRenderReq);

};
