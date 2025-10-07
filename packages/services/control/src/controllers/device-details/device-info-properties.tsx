

import { ColumnsLayout } from '../../components/columns.js';
import { Table, TableColumn } from '../../components/table.js';
import { HonoContext, ListQueryParams } from '../../utils.js';
import { SelectableDevice, SelectableNode, SelectableProperty, ExtendedSelectableProperty, selectNodesByDeviceId, selectPropertiesByDeviceId, selectPropertyById, selectReports } from '@grovekit/database';
import { Section } from '../../components/section.js';
import { PaginatorOpts } from '../../components/pagination.js';
import { Child } from 'hono/jsx';
import { is } from '@deepkit/type';
import { NULL_REPORT_ID } from '../../components/reports/types.js';
import { AutoResizingIframe } from '../../components/iframe.js';


interface PropertiesQueryParams extends ListQueryParams<SelectableProperty, 'name' | 'unit'> {

}

export const presentDeviceInfoAndProperties = async (ctx: HonoContext, device: SelectableDevice): Promise<Child> => {

  const db = ctx.get('db');
  const curr_url = ctx.get('url');

  const query_params: any = Object.fromEntries(curr_url.searchParams.entries());

  if (!is<PropertiesQueryParams>(query_params)) {
    return (<>Error! Invalid request parameters.</>);
  }

  const nodes = await selectNodesByDeviceId(db, device.id);
  const props = await selectPropertiesByDeviceId(db, device.id, query_params);

  const nodes_by_id = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, SelectableNode>);

  const reports = await selectReports(db);

  const side = (<>
    <Section title="State">
      <p style={{ fontFamily: 'var(--q-font-family-monospace)', textTransform: 'uppercase' }}>{device.state}</p>
    </Section>
    <Section title="With selected properties">
      <form id="q-with-selected-properties-form" method="post" action={`/devices/${device.id}/with_selected_properties`}>
        <fieldset>
          <legend>Add to new report</legend>
          <button name="action" value="add_to_new_report">Add</button>
        </fieldset>
        <fieldset>
          <legend>Add to existing report</legend>
          <select name="report_id">
            {reports.map(r => (<option value={r.id}>{r.title}</option>))}
          </select>
          <button formtarget="q-with-selected-properties-form-target" name="action" value="add_to_existing_report">Add</button>
        </fieldset>
      </form>
      <AutoResizingIframe name="q-with-selected-properties-form-target" />
    </Section>
  </>);

  const columns: TableColumn<ExtendedSelectableProperty, 'name' | 'unit'>[] = [
    {
      label: '',
      expand: false,
      sortable: false,
      render: (row) => <><input type="checkbox" form="q-with-selected-properties-form" name="property_id" value={row.record.id} /></>,
    },
    {
      label: 'Name',
      expand: true,
      sortable: 'name',
      render: (row) => (<>{row.record.name ?? row.record.homie_id} <em style={{fontSize: '0.8em'}}>({row.record.datatype})</em></>),
    },
    {
      label: 'Value',
      expand: false,
      sortable: false,
      render: (row) => <>
        {row.record.value !== null ? `${row.record.value}${row.record.unit ? ` ${row.record.unit}` : ''}` : 'N/A'}
      </>,
      class: 'q-text-align-right q-font-monospace',
    },
    {
      label: 'Set',
      expand: false,
      sortable: false,
      render: (row) => true || row.record.settable ? (<a href={`/properties/${row.record.id}/set`} target="q-property-set-value-iframe">set</a>) : null,
      class: 'q-text-align-right q-font-monospace',
    },
    {
      label: 'Node',
      expand: false,
      sortable: false,
      render: (row) => <>{nodes_by_id[row.record.node_id]!.name}</>,
    },
  ];

  const paginator: PaginatorOpts = {
    query_param: 'page',
    total_records: 100,
    curr_url,
    per_page: 10,
  };

  const main = (<>
    <Section title="properties">
      <Table<ExtendedSelectableProperty>
        columns={columns}
        records={props}
        paginator={paginator}
        curr_url={curr_url}
        order_col_query_param="order_by"
        order_dir_query_param="order_dir"
      />
    </Section>
  </>);

  return (
    <ColumnsLayout columns={[
      { content: side, flexGrow: 1 },
      { content: main, flexGrow: 4 },
      // { content: chart },
    ]} />
  );

};
