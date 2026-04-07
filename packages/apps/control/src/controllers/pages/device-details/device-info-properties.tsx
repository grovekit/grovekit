
import { Table, TableColumn } from '../../../components/table.js';
import { HonoContext, ListQueryParams, prettyRawValue } from '../../../utils.js';
import { SelectableDevice, SelectableNode, SelectableProperty, ExtendedSelectableProperty, selectNodesByDeviceId, selectPropertiesByDeviceId, selectPropertyById, selectReports } from '@grovekit/database';
import { Section } from '../../../components/section.js';
import { PaginatorOpts } from '../../../components/pagination.js';
import { Child } from 'hono/jsx';
import { cast } from '@deepkit/type';
import { PropertyValue } from '../../../components/value.js';


interface PropertiesQueryParams extends ListQueryParams<SelectableProperty, 'name' | 'unit'> {

}

export const presentDeviceInfoAndProperties = async (ctx: HonoContext, device: SelectableDevice): Promise<Child> => {

  const db = ctx.get('db');
  const curr_url = ctx.get('url');

  const query_params = cast<PropertiesQueryParams>(Object.fromEntries(curr_url.searchParams.entries()));

  const nodes = await selectNodesByDeviceId(db, device.id);
  const props = await selectPropertiesByDeviceId(db, device.id, query_params);

  const nodes_by_id = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, SelectableNode>);

  const reports = await selectReports(db);

  const columns: TableColumn<ExtendedSelectableProperty, 'name' | 'unit'>[] = [
    {
      label: '',
      expand: false,
      sortable: false,
      render: (row) => <><input class="q-checkbox-big" type="checkbox" form="q-with-selected-properties-form" name="property_id" value={row.record.id} /></>,
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
      render: (row) => (<PropertyValue topic={row.record.value_topic} value={prettyRawValue(row.record.value, row.record.datatype)} />),
      class: 'q-text-align-right q-font-monospace',
    },
    {
      label: 'Unit',
      expand: false,
      sortable: false,
      render: (row) => (<>{row.record.unit}</>),
      class: 'q-text-align-left q-font-monospace',
    },
    {
      label: 'Set',
      expand: false,
      sortable: false,
      render: (row) => row.record.settable ? (<a href={`/modals/properties/set/${row.record.id}`} target="q-bottom-modal-iframe">set</a>) : null,
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

  const interstitial = (
    <div style={{textAlign: 'right', margin: '1rem 0'}}>
      <form id="q-with-selected-properties-form" target="q-bottom-modal-iframe" method="post" action={`/modals/properties/with_selected`} class="q-form-inline">
        With selected properties: <button type="submit" name="action" value="add_to_new_report">add to new report</button> or <button type="submit" name="action" value="add_to_existing_report">add to existing report</button>
      </form>
    </div>
  );

  const main = (<>

  </>);

  return (<>
    <Section title="Information">
      <p style={{ fontFamily: 'var(--q-font-family-monospace)', textTransform: 'uppercase' }}>{device.state}</p>
      <p style={{ fontFamily: 'var(--q-font-family-monospace)', textTransform: 'uppercase' }}>{new Date(device.updated_at).toLocaleString()}</p>
    </Section>

    <Section title="properties">
      {interstitial}
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

};
