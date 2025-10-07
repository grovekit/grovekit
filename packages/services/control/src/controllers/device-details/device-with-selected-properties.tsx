
import { is } from "@deepkit/type";
import { HonoInstance } from "../../utils.js";
import { arrayfy, local_timezone, toZonedDatetimeString } from "@grovekit/utils";
import { addPropertiesToReport, selectPropertiesByIds } from "@grovekit/database";
import { flattenReportParams } from "../reports/utils.js";
import { NULL_REPORT_ID, ReportParams } from "../../components/reports/types.js";
import { IFramedFrame } from "../../components/frame.js";

interface WithSelectedPropertiesRequest {
  action: 'add_to_new_report' | 'add_to_existing_report';
  report_id: string;
  property_id: string | string[];
}

export const deviceWithSelectedPropertiesController = (app: HonoInstance) => {

  app.post('/devices/:id/with_selected_properties', async (ctx) => {

    const db = ctx.get('db');
    const device_id = ctx.req.param('id');

    const req_body = await ctx.req.parseBody({ all: true });

    if (!is<WithSelectedPropertiesRequest>(req_body)) {
      ctx.status(400);
      return ctx.json({ error: 'Invalid request body' });
    }

    const { action, report_id, property_id } = req_body;

    const property_ids = arrayfy(property_id);

    if (action === 'add_to_existing_report') {
      // The result of this action is rendered into an iframe
      await addPropertiesToReport(db, report_id, property_ids);
      return ctx.html(
        <IFramedFrame autohide={10}>
          <h1>All done! <a href={`/reports/${report_id}`} target="_parent">Go to report</a>.</h1>
        </IFramedFrame>
      );
    }

    const redirect_url = new URL(ctx.get('url'));
    redirect_url.pathname = `/reports/${NULL_REPORT_ID}`;
    const properties = await selectPropertiesByIds(db, property_ids);
    flattenReportParams(redirect_url.searchParams, {
      opts: {
        title: 'New Report',
        mode: 'chart',
        from: '-6h',
        to: 'now',
        timezone: local_timezone,
        save_on_apply: 'false',
        height: '400px',
        width: '100%',
        aggr_win: 'hour',
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
    return ctx.redirect(redirect_url);
  });

};
