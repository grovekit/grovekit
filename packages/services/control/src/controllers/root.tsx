
import { HonoInstance } from '../utils.js';

export const rootController = (app: HonoInstance) => {

  app.get('/', async (ctx) => {
    return ctx.redirect('/devices/list');
  });

};
