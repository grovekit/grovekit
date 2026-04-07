
// import { Page, MasterDetailLayout, Table, type TableColumn, TimeChart } from '@grovekit/ui';
import { Page } from '../../components/page.js';
import { ColumnsLayout } from '../../components/columns.js';
import { Table, TableColumn } from '../../components/table.js';
import { HonoInstance, getMainMenuItems, ListQueryParams } from '../../utils.js';
import { countDevices, SelectableDevice, selectDevices } from '@grovekit/database';
import { Main } from '../../components/main.js';
import { YURL } from 'yurl';
import { cast, is } from '@deepkit/type';
import { DEVICE_STATE } from '@grovekit/homie-core';

interface DeviceListQueryParams extends ListQueryParams<SelectableDevice, 'name' | 'state' | 'open_alerts' | 'homie_prefix'> {
  state?: DEVICE_STATE;
}

// const DeviceListQueryParams_schema = getListQueryParamsSchema<SelectableDevice, 'name' | 'state'>(['name', 'state']);

const columns: TableColumn<SelectableDevice, 'name' | 'state' | 'open_alerts' | 'homie_prefix'>[] = [
  {
    label: 'Prefix',
    expand: false,
    sortable: 'homie_prefix',
    render: ({ record }) => <>{record.homie_prefix}</>
  },
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

    const query_params = cast<DeviceListQueryParams>(Object.fromEntries(curr_url.searchParams.entries()));

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

    return ctx.html(
      <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
        <Main title='Devices'>
          {master}
        </Main>
      </Page>
    );

  });

};
