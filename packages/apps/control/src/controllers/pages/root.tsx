
import { HonoInstance } from '../../utils.js';

export const initRootController = (app: HonoInstance) => {

  app.get('/', async (ctx) => {
    return ctx.redirect('/devices/list');
  });

};
