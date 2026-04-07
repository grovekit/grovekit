
import { cast } from "@deepkit/type";
import { HonoInstance } from "../../utils.js";
import { arrayfy, local_timezone } from "@grovekit/utils";
import { addPropertiesToReport, selectPropertiesByIds, selectReports } from "@grovekit/database";
import { flattenReportParams } from "../pages/reports/utils.js";
import { NULL_REPORT_ID, ReportParams } from "../../components/reports/types.js";
import { IframeModalPage } from "../../components/iframe.js";

interface PropertiesWithSelectedReqBody {
  action: 'add_to_new_report' | 'add_to_existing_report';
  report_id?: string;
  property_id?: string | string[];
}

export const initPropertiesWithSelectedModalController = (app: HonoInstance) => {

  // The result of this action is rendered into an iframe
  app.post('/modals/properties/with_selected', async (ctx) => {

    const db = ctx.get('db');
    const curr_url = ctx.get('url');

    const req_body = cast<PropertiesWithSelectedReqBody>(await ctx.req.parseBody({ all: true }));

    const { action, report_id, property_id } = req_body;

    if (!property_id) {
      return ctx.html(<IframeModalPage>No property selected</IframeModalPage>);
    }

    const property_ids = arrayfy(property_id);

    if (action === 'add_to_new_report') {
      const redirect_url = new URL(ctx.get('url'));
      redirect_url.pathname = `/reports/details`;
      const properties = await selectPropertiesByIds(db, property_ids);
      flattenReportParams(redirect_url.searchParams, {
        opts: {
          id: NULL_REPORT_ID,
          title: 'New Report',
          mode: 'chart',
          from: '-15m',
          to: 'now',
          timezone: local_timezone,
          save_on_apply: 'false',
          height: '400px',
          width: '100%',
          aggr_win: 'minute',
          autorefresh: 'false',
        },
        series: properties.map((property) => ({
          property_id: property.id,
          color: 'red',
          label: `${property.device_name} ${property.name}`,
          delete: 'false',
          style: 'line',
          aggr_op: 'avg',
          aggr_unit: 'hour',
          datatype: property.datatype,
        })) as ReportParams['series'],
      });
      return ctx.html(<IframeModalPage
        parent_redirect={redirect_url}
      />);
    }

    if (action === 'add_to_existing_report') {

      if (!report_id) {
        const reports = await selectReports(db);
        return ctx.html(
          <IframeModalPage>
            <p>Please select a report:</p>
            <form action={curr_url.toString()} method="post">
              <input type="hidden" name="action" value={action} />
              {property_ids.map(pid => (<input type="hidden" name="property_id" value={pid} />))}
              <select name="report_id">
                {reports.map(r => (<option value={r.id}>{r.title}</option>))}
              </select>
              <button type="submit">Add</button>
            </form>
          </IframeModalPage>
        );
      }

      await addPropertiesToReport(db, report_id, property_ids);
      return ctx.html(
        <IframeModalPage autohide={10}>
          <h1>All done! <a href={`/reports/${report_id}`} target="_parent">Go to report</a>.</h1>
        </IframeModalPage>
      );
    }

    throw new Error('action not supported');

  });

};
