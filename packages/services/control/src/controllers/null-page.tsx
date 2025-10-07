import { HonoInstance } from "../utils.js";

export const nullPageController = (app: HonoInstance) => {
  app.get('/null_page', async (ctx) => {
    const page = (
      <html style={{ height: 0 }}>
        <body style={{ height: 0 }}>

        </body>
      </html>
    );
    return ctx.html(page, 200);
  });
};
