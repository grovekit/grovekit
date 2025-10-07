
import { Page } from '../../components/page.js';
import { Table, TableColumn } from '../../components/table.js';
import { getMainMenuItems, HonoInstance, ListQueryParams } from '../../utils.js';
import { Main } from '../../components/main.js';
import { is } from '@deepkit/type';
import { selectReports, SelectableReport } from '@grovekit/database/dist/tables/reports.js';
import { ColumnsLayout } from '../../components/columns.js';
import { Section } from '../../components/section.js';

interface ReportListQueryParams extends ListQueryParams<SelectableReport, 'title'> {
  // state?: DEVICE_STATE;
}

// const DeviceListQueryParams_schema = getListQueryParamsSchema<SelectableDevice, 'name' | 'state'>(['name', 'state']);

const columns: TableColumn<SelectableReport, 'title'>[] = [
  {
    label: 'Title',
    expand: true,
    sortable: 'title',
    render: ({ record }) => <><a href={`/reports/${record.id}` }>{record.title}</a></>
  },
];


export const reportListController = (app: HonoInstance) => {

  app.get('/reports/list', async (ctx) => {

    const curr_url = ctx.get('url');

    const query_params: any = Object.fromEntries(curr_url.searchParams.entries());

    // if (!ajv.validate<DeviceListQueryParams>(DeviceListQueryParams_schema, query_params)) {
    if (!is<ReportListQueryParams>(query_params)) {
      // TODO: implement error pages
      return ctx.json({ error: 'invalid request parameters' }, 400);
    }

    const reports = await selectReports(ctx.get('db'));

    const reports_table = (<Table
      columns={columns}
      records={reports}
      curr_url={curr_url}
      order_col_query_param="order_by"
      order_dir_query_param="order_dir"
      paginator={false}
    />);

    return ctx.html(
      <Page title="device detail" menu={{ items: getMainMenuItems(ctx) }}>
        <Main title="Reports">
          { reports_table }
        </Main>
      </Page>
    );

  });

};
