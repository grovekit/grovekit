
import { ALERT_STATUS, countDeviceAlerts, selectDeviceAlerts, ExtendedSelectableDeviceAlert } from "@grovekit/database";
import { getNumericQueryParam, HonoInstance, getMainMenuItems, ListQueryParams } from "../../utils.js";
import { is, ValidationErrorItem, cast } from "@runtyped/type";
import { Table } from "../../components/table.js";
import { Section } from "../../components/section.js";
import { ColumnsLayout } from "../../components/columns.js";
import { Page } from "../../components/page.js";
import { Main } from "../../components/main.js";

interface AlertsQueryParams extends ListQueryParams<ExtendedSelectableDeviceAlert, 'updated_at'> {
  status?: ALERT_STATUS;
}

export const alertsController = (app: HonoInstance) => {

  app.get('/alerts', async (ctx) => {

    const db = ctx.get('db');
    const curr_url = ctx.get('url');

    const query_params = cast<AlertsQueryParams>(Object.fromEntries(curr_url.searchParams.entries()));

    // const errors: ValidationErrorItem[] = [];

    // if (!cast<AlertsQueryParams>(query_params, undefined, errors)) {
    //   return ctx.html(<>
    //     <p>Error! Invalid request parameters.</p>
    //     <pre>{JSON.stringify(errors, null, 2)}</pre>
    //   </>);
    // }

    const no_status_url = new URL(curr_url);
    no_status_url.searchParams.delete('status');
    no_status_url.searchParams.delete('page');

    const count = await countDeviceAlerts(db,  {
      status: query_params.status,
    });

    const per_page = 1000;
    const curr_page = getNumericQueryParam(ctx, 'page', 1, 1, count);

    const alerts = await selectDeviceAlerts(db,  {
      status: query_params.status,
      offset: (curr_page - 1) * per_page,
      limit: per_page,
      order_by: query_params.order_by,
      order_dir: query_params.order_dir,
    });

    const table = (
      <Table<ExtendedSelectableDeviceAlert>
        columns={[
          {
            label: 'Message',
            render: (row) => <>{row.record.message}</>,
            sortable: false,
            expand: true,
          },
          {
            label: 'Device',
            render: (row) => (<a href={`/devices/${row.record.device_id}/alerts`}>{row.record.device_name}</a>),
            sortable: false,
            expand: false,
          },
          {
            label: 'Status',
            render: (row) => <>{row.record.status}</>,
            sortable: false,
            expand: false,
          },
          {
            label: 'Alert ID',
            render: (row) => <>{row.record.alert_id}</>,
            sortable: false,
            expand: false,
          },
          {
            label: 'Updated at',
            render: (row) => <>{new Date(parseInt(row.record.updated_at.toString())).toLocaleString()}</>,
            sortable: 'updated_at',
            expand: false,
          },
        ]}
        records={alerts}
        paginator={{
          curr_url: curr_url,
          query_param: 'page',
          per_page,
          total_records: count,
        }}
        curr_url={curr_url}
        order_col_query_param="order_by"
        order_dir_query_param="order_dir"
      />
    );

    const main = (
      <Section title="Alerts">
        {table}
      </Section>
    );

    const side = (
      <Section title="Status">
        <form action={curr_url.toString()} method="get">
          <input type="hidden" name="page" value={1} />
          <select name="status">
            <option value="" selected={!query_params.status}>All</option>
            <option value={ALERT_STATUS.OPEN} selected={query_params.status === ALERT_STATUS.OPEN}>Open</option>
            <option value={ALERT_STATUS.CLOSED} selected={query_params.status === ALERT_STATUS.CLOSED}>Closed</option>
          </select>
          <p>
            <button type="submit" class="q-button q-primary">Apply</button>
            <a href={no_status_url.toString()} class="q-button q-secondary">Reset</a>
          </p>
        </form>
      </Section>
    );

    return ctx.html(
      <Page title="Alerts" menu={{ items: getMainMenuItems(ctx) }}>
        <Main title="Alerts">
          {side}
          {main}
        </Main>
      </Page>
    );

  });

};
