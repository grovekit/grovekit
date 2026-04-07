
import { Child, FC } from 'hono/jsx';
import { Paginator, PaginatorOpts } from './pagination.js';

const getURLOrderParams = (url: string | URL, col_key: string, dir_key: string, def_key: string, def_dir: 'asc' | 'desc'): [string, 'asc' | 'desc'] => {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  let col_value = url.searchParams.get(col_key) ?? def_key;
  let dir_value = url.searchParams.get(dir_key) ?? def_dir;
  if (dir_value !== 'asc' && dir_value !== 'desc') {
    dir_value = 'asc';
  }
  return [col_value, dir_value as 'asc' | 'desc'];
};

const setURLOrderParams = (url: string | URL, col_key: string, dir_key: string, col_value: string, dir_value: 'asc' | 'desc') => {
  const _url = new URL(url);
  _url.searchParams.set(col_key, col_value);
  _url.searchParams.set(dir_key, dir_value);
  return _url.toString();
};

interface TableHeaderProps<R extends {}, SF extends string> {
  column: TableColumn<R, SF>;
  table: TableProps<R, SF>;
}

/** Renders the provided column definition into a <TH> element */
const TableHeader = (<R extends {}, SF extends string>(props: TableHeaderProps<R, SF>) => {
  const { column: { sortable, label }, table: { curr_url, order_col_query_param, order_dir_query_param } } = props;
  const sorting_ctrls = sortable ? (
    <span class="q-sort-ctrls">
      <a href={ setURLOrderParams(curr_url, order_col_query_param, order_dir_query_param, sortable, 'asc')}>↑</a>
      <a href={ setURLOrderParams(curr_url, order_col_query_param, order_dir_query_param, sortable, 'desc')}>↓</a>
    </span>
  ) : null;
  return (<th>{props.column.label}{sorting_ctrls}</th>);
}) satisfies FC<TableHeaderProps<any, any>>;

export interface TableCellProps<R extends {}, SF extends string> {
  column: TableColumn<R, SF>;
  record: R;
  table: TableProps<R, SF>;
}

/** Renders a <TD> element given a column definition and a compatible record */
const TableCell = (<T extends {}, SF extends string>(props: TableCellProps<T, SF>) => {
  return (
    <td className={`${props.column.expand ? 'q-expand' : ''} ${props.column.class}`}>
      { props.column.render({ record: props.record })}
    </td>
  );
}) satisfies FC<TableCellProps<any, any>>;

export interface TableRowProps<R extends {}, SF extends string> {
  columns: TableColumn<R, SF>[];
  record: R;
  table: TableProps<R, SF>;
}

const TableRow = (<R extends {}, SF extends string>(props: TableRowProps<R, SF>) => {
  return (
    <tr>
      {props.columns.map(column => <TableCell column={column} record={props.record} table={props.table} />)}
    </tr>
  );
}) satisfies FC<TableRowProps<any, any>>;

export interface TableColumn<R extends {}, SF extends string> {
  label: string;
  render: FC<{ record: R; }>;
  expand: boolean;
  sortable: false | SF;
  class?: string;
}

export interface TableProps<R extends {}, SF extends string = Exclude<keyof R, number | symbol>> {
  curr_url: URL | string;
  order_col_query_param: string;
  order_dir_query_param: string;
  columns: TableColumn<R, SF>[];
  records: R[];
  paginator: false | PaginatorOpts;
  interstitial?: Child;

}

export const Table = (<R extends {}>(props: TableProps<R>) => {
  const paginator = props.paginator ? (<Paginator {...props.paginator} />) : null;
  return (
    <>
      {paginator}
      {props.interstitial}
      <table class="q-table">
        <thead>
          <tr>
            {props.columns.map(column => <TableHeader column={column} table={props} />)}
          </tr>
        </thead>
        <tbody>
          {props.records.map(record => <TableRow columns={props.columns} record={record} table={props} />)}
        </tbody>
      </table>
      {props.interstitial}
      {paginator}
    </>
  );
}) satisfies FC<TableProps<any>>;
