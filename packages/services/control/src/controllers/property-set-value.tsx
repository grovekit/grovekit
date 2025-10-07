import { publishPropertySetRequest, selectFeedById, selectPropertyById } from "@grovekit/database";
import { IFramedFrame } from "../components/frame.js";
import { HonoInstance } from "../utils.js";
import { Child } from "hono/jsx";
import { serializeValue } from "@grovekit/homie-core";
import { EnumFormat } from "@grovekit/homie-core";
import { is, ValidationErrorItem } from "@deepkit/type";

export const propertySetValueController = (app: HonoInstance) => {

  app.get('/properties/:id/set', async (ctx) => {

    const db = await ctx.get('db');

    const property_id = ctx.req.param('id');
    const property = await selectPropertyById(db, property_id);

    if (!property /* || !property.settable */) {
      return ctx.redirect('/null_page');
    }

    let input_el: Child;

    switch (property.datatype) {
      case "string":
        input_el = (<input type="text" name="value" value={String(property.value)} />);
        break;
      case "boolean":
        input_el = (
          <select name="value">
            <option value="true" checked={Boolean(property.value)}>True</option>
            <option value="false" checked={Boolean(property.value)}>False</option>
          </select>
        );
        break;
      case "integer":
      case "float":
        input_el = (<input type="number" name="value" value={Number(property.value)} />);
        break;
      case "enum":
        input_el = (
          <select name="value">
            {(property.format as EnumFormat).values.map((value) => (
              <option value={value} selected={value === property.value}>{value}</option>
            ))}
          </select>
        );
        break;
      case "color":
      case "datetime":
      case "duration":
      case "json":
    }

    return ctx.html(
      <IFramedFrame>
        <div style={{background: 'grey'}}>
          <h1>New value for property {property.name} of device {property.device_name}</h1>
          <form action={`/properties/${property_id}/set`} method="post">
            { input_el }
            <button type="submit">Submit</button>
          </form>
        </div>
      </IFramedFrame>
    );
  });

  interface PropertySetPOSTRequest {
    value: string | number | boolean;
  }

  app.post('/properties/:id/set', async (ctx) => {

    const db = ctx.get('db');
    const body = await ctx.req.parseBody();
    const property_id = ctx.req.param('id');

    const property = await selectPropertyById(db, property_id);

    if (!property) {
      return ctx.html(
        <IFramedFrame autohide={1}>
          <h1>Property not found</h1>
        </IFramedFrame>
      );
    }

    const feed = (await selectFeedById(db, property.set_fid))!;

    const errs: ValidationErrorItem[] = [];

    if (!is<PropertySetPOSTRequest>(body, undefined, errs)) {
      return ctx.html(
        <IFramedFrame autohide={10}>
          <h1>Invalid request</h1>
          <pre>{JSON.stringify(errs, null, 2)}</pre>
          <pre>{JSON.stringify(body, null, 2)}</pre>
        </IFramedFrame>
      )
    }

    const { value } = body;

    const raw_value = serializeValue(value, property.format);

    if (raw_value === undefined) {
      return ctx.html(
        <IFramedFrame autohide={1}>
          <h1>Failed to serialize value</h1>
        </IFramedFrame>
      );
    }

    await publishPropertySetRequest(db, { topic: feed.topic, value: raw_value });

    return ctx.html(
      <IFramedFrame autohide={1}>
        <h1>Done!</h1>
      </IFramedFrame>
    )
  });

};
