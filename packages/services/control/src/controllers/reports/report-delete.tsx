
import { HonoInstance } from '../../utils.js';
import { removeReport } from '@grovekit/database';

export const reportDeleteController = (app: HonoInstance) => {

  app.post('/reports/:id/delete', async (ctx) => {
    const id = ctx.req.param('id');
    await removeReport(ctx.get('db'), id);
    return ctx.redirect(`/reports/list`);
  });

};
