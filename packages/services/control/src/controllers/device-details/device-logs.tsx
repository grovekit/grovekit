

import { ColumnsLayout } from '../../components/columns.js';
import { Table } from '../../components/table.js';
import { getNumericQueryParam, HonoContext } from '../../utils.js';
import { countDeviceLogsByDeviceId, SelectableDevice, SelectableDeviceLog, selectDeviceLogsByDeviceId } from '@grovekit/database';
import { Section } from '../../components/section.js';
import { Child } from 'hono/jsx';
import { LOG_LEVEL } from '@grovekit/homie-core';
import { is } from '@deepkit/type';

export const presentDeviceLogs = async (ctx: HonoContext, device: SelectableDevice): Promise<Child> => {

  const db = ctx.get('db');
  const curr_url = ctx.get('url');

  let levels: string[] | LOG_LEVEL[] | undefined = curr_url.searchParams.getAll('level');

  if (!is<LOG_LEVEL[]>(levels)) {
    levels = undefined;
  }

  const no_levels_url = new URL(curr_url);
  no_levels_url.searchParams.delete('level');
  no_levels_url.searchParams.delete('page');

  const count = await countDeviceLogsByDeviceId(db, device.id, { levels });

  const per_page = 1000;
  const curr_page = getNumericQueryParam(ctx, 'page', 1, 1, count);

  const logs = await selectDeviceLogsByDeviceId(db, device.id, {
    levels,
    offset: (curr_page - 1) * per_page,
    limit: per_page,
  });

  const table = (
    <Table<SelectableDeviceLog>
      columns={[
        {
          label: 'Message',
          render: (row) => <>{row.record.message}</>,
          sortable: false,
          expand: true,
        },
        {
          label: 'Level',
          render: (row) => <>{row.record.level}</>,
          sortable: false,
          expand: false,
        },
        {
          label: 'Time',
          render: (row) => <>{new Date(parseInt(row.record.logged_at.toString())).toLocaleString()}</>,
          sortable: false,
          expand: false,
        },
      ]}
      records={logs}
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
    <Section title="Log messages">
      {table}
    </Section>
  );

  const side = (
    <Section title="Level">
      <form action={curr_url.toString()} method="get">
        <input type="hidden" name="page" value={1} />
        <ul class="q-unstyled-list">
          <li><label><input type="checkbox" name="level" value={LOG_LEVEL.DEBUG} checked={levels?.includes(LOG_LEVEL.DEBUG)} /> Debug</label></li>
          <li><label><input type="checkbox" name="level" value={LOG_LEVEL.INFO} checked={levels?.includes(LOG_LEVEL.INFO)}/> Info</label></li>
          <li><label><input type="checkbox" name="level" value={LOG_LEVEL.WARN} checked={levels?.includes(LOG_LEVEL.WARN)}/> Warning</label></li>
          <li><label><input type="checkbox" name="level" value={LOG_LEVEL.ERROR} checked={levels?.includes(LOG_LEVEL.ERROR)}/> Error</label></li>
          <li><label><input type="checkbox" name="level" value={LOG_LEVEL.FATAL} checked={levels?.includes(LOG_LEVEL.FATAL)}/> Fatal</label></li>
        </ul>
        <p>
          <button type="submit" class="q-button q-primary">Apply</button>
          <a href={no_levels_url.toString()} class="q-button q-secondary">Reset</a>
        </p>
      </form>
    </Section>
  );

  return (
    <ColumnsLayout columns={[
      { content: side, flexGrow: 1 },
      { content: main, flexGrow: 4 },
      // { content: chart },
    ]} />
  );
};
