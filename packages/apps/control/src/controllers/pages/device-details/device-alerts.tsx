

import { ColumnsLayout } from '../../../components/columns.js';
import { Table } from '../../../components/table.js';
import { getNumericQueryParam, HonoContext, ListQueryParams } from '../../../utils.js';
import { ALERT_STATUS, countDeviceAlerts, SelectableDevice, SelectableDeviceAlert, selectDeviceAlerts } from '@grovekit/database';
import { Section } from '../../../components/section.js';
import { Child } from 'hono/jsx';
import { cast, is } from '@deepkit/type';

interface DeviceAlertsQueryParams extends ListQueryParams<SelectableDeviceAlert, 'updated_at'> {
  status?: ALERT_STATUS;
}

export const presentDeviceAlerts = async (ctx: HonoContext, device: SelectableDevice): Promise<Child> => {

  const db = ctx.get('db');
  const curr_url = ctx.get('url');

  const query_params = cast<DeviceAlertsQueryParams>(Object.fromEntries(curr_url.searchParams.entries()));

  const no_status_url = new URL(curr_url);
  no_status_url.searchParams.delete('status');
  no_status_url.searchParams.delete('page');

  const count = await countDeviceAlerts(db,  {
    device_id: device.id,
    status: query_params.status,
  });

  const per_page = 1000;
  const curr_page = getNumericQueryParam(ctx, 'page', 1, 1, count);

  const alerts = await selectDeviceAlerts(db,  {
    device_id: device.id,
    status: query_params.status,
    offset: (curr_page - 1) * per_page,
    limit: per_page,
    order_by: query_params.order_by,
    order_dir: query_params.order_dir,
  });

  const table = (
    <Table<SelectableDeviceAlert>
      columns={[
        {
          label: 'Message',
          render: (row) => <>{row.record.message}</>,
          sortable: false,
          expand: true,
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
          label: 'Created at',
          render: (row) => <>{new Date(parseInt(row.record.created_at.toString())).toLocaleString()}</>,
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
          <option value="">All</option>
          <option value={ALERT_STATUS.OPEN}>Open</option>
          <option value={ALERT_STATUS.CLOSED}>Closed</option>
        </select>
        <p>
          <button type="submit" class="q-button q-primary">Apply</button>
          <a href={no_status_url.toString()} class="q-button q-secondary">Reset</a>
        </p>
      </form>
    </Section>
  );

  return (<>
    {side}
    {main}
  </>);
};
