

import { removeReport, selectReportById } from "@grovekit/database";
import { HonoInstance } from "../../utils.js";
import { IframeModalPage } from "../../components/iframe.js";

export const initReportsDeleteModalController = (app: HonoInstance) => {

  app.use('/modals/reports/delete/:id', async (ctx, next) => {
    const db = ctx.get('db');
    const report_id = ctx.req.param('id');
    const report = await selectReportById(db, report_id);
    if (!report) {
      return ctx.html(<IframeModalPage>report not found</IframeModalPage>);
    }
    return next();
  });

  app.get('/modals/reports/delete/:id', async (ctx) => {
    const db = ctx.get('db');
    const report_id = ctx.req.param('id');
    return ctx.html(
      <IframeModalPage>
        <p>Are you sure you want to delete this report?</p>
        <form method="post" action={`/modals/reports/delete/${report_id}`}>
          <button type="submit">Delete</button>
        </form>
      </IframeModalPage>
    );
  });

  app.post('/modals/reports/delete/:id', async (ctx) => {
    const db = ctx.get('db');
    const curr_url = ctx.req.url;
    const report_id = ctx.req.param('id');
    await removeReport(db, report_id);
    const redirect_url = new URL(curr_url);
    redirect_url.pathname = '/reports/list';
    return ctx.html(<IframeModalPage parent_redirect={redirect_url} />)
  });

};
