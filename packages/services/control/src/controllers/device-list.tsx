
// import { Page, MasterDetailLayout, Table, type TableColumn, TimeChart } from '@grovekit/ui';
import { Page } from '../components/page.js';
import { ColumnsLayout } from '../components/columns.js';
import { Table, TableColumn } from '../components/table.js';
import { HonoInstance, getMainMenuItems, ListQueryParams } from '../utils.js';
import { countDevices, SelectableDevice, selectDevices } from '@grovekit/database';
import { Main } from '../components/main.js';
import { YURL } from 'yurl';
import { is } from '@deepkit/type';
import { DEVICE_STATE } from '@grovekit/homie-core';

interface DeviceListQueryParams extends ListQueryParams<SelectableDevice, 'name' | 'state' | 'open_alerts'> {
  state?: DEVICE_STATE;
}

// const DeviceListQueryParams_schema = getListQueryParamsSchema<SelectableDevice, 'name' | 'state'>(['name', 'state']);

const columns: TableColumn<SelectableDevice, 'name' | 'state' | 'open_alerts'>[] = [
  {
    label: 'Name',
    expand: true,
    sortable: 'name',
    render: ({ record }) => <><a href={`/devices/${record.id}` }>{record.name ?? record.homie_id }</a></>
  },
  {
    label: 'State',
    expand: false,
    sortable: 'state',
    render: ({ record }) => <>{record.state}</>
  },
  {
    label: 'Open alerts',
    expand: false,
    sortable: 'open_alerts',
    render: ({ record }) => <>{String(record.open_alerts)}</>
  },
];


export const deviceListController = (app: HonoInstance) => {

  app.get('/devices/list', async (ctx) => {

    const curr_url = ctx.get('url');

    const query_params: any = Object.fromEntries(curr_url.searchParams.entries());

    // if (!ajv.validate<DeviceListQueryParams>(DeviceListQueryParams_schema, query_params)) {
    if (!is<DeviceListQueryParams>(query_params)) {
      // TODO: implement error pages
      return ctx.json({ error: 'invalid request parameters' }, 400);
    }

    const all_devices_count = await countDevices(ctx.get('db'));
    const all_devices_url = new YURL(curr_url.toString()).query().toString();

    const lost_devices_count = await countDevices(ctx.get('db'), { state: DEVICE_STATE.LOST });
    const lost_devices_url = new YURL(all_devices_url).query().query({ state: DEVICE_STATE.LOST }).toString();

    const devices = await selectDevices(ctx.get('db'), query_params);
    const device_count = await countDevices(ctx.get('db'), {
      state: query_params.state,
    });

    const devices_table = (<Table
      columns={columns}
      records={devices}
      curr_url={curr_url}
      order_col_query_param="order_by"
      order_dir_query_param="order_dir"
      paginator={{
        curr_url,
        per_page: 100,
        query_param: 'page',
        total_records: device_count,
      }}
    />);

    const master = (
      <>
        {devices_table}
      </>
    );

    const intro = (<>
      <p>
        Welcome back!
        <br />
        <a href={all_devices_url}>{all_devices_count} registered devices</a>.
        { lost_devices_count > 0 && (
          <>
            <br />
            <a href={lost_devices_url}>{lost_devices_count} device{lost_devices_count === 1 ? '' : 's'} offline</a>.
          </>
        ) }
        <br /> 0 devices reporting anomalies.
      </p>
    </>);

    return ctx.html(
      <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
        <Main title='Devices'>
          <ColumnsLayout columns={[
            { content: intro, flexGrow: 1 },
            { content: master, flexGrow: 4 },
            // { content: chart },
          ]}  />
        </Main>
      </Page>
    );

  });

};
