
import { FC } from "hono/jsx";

const getURLPageParam = (url: string | URL, key: string, value: number, total_pages: number): number => {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  let page: number | string | null = url.searchParams.get('page');
  if (page === null || (typeof page === 'string' && Number.isNaN(page = parseInt(page)))) {
    page = 1;
  }
  return page > 0 && page <= total_pages ? page : 1;
};

const setURLPageParam = (url: string | URL, key: string, value: number) => {
  const _url = new URL(url);
  _url.searchParams.set(key, String(value));
  return _url.toString();
};

export interface PaginatorOpts {
  curr_url: URL | string;
  per_page: number;
  query_param: string;
  total_records: number;
}

export const Paginator: FC<PaginatorOpts> = (props) => {

  const {
    curr_url,
    per_page,
    query_param,
    total_records,
  } = props;

  const total_pages = Math.ceil(total_records / per_page);
  const curr_page = getURLPageParam(curr_url, query_param, 1, total_pages);

  return (
    <div class="q-pagination">
      { curr_page > 1 && (
        <>
        <a href={setURLPageParam(curr_url, query_param, 1)} class="q-first">first</a>
        <a href={setURLPageParam(curr_url, query_param, curr_page - 1)} class="q-prev">prev</a>
        </>
      ) }
      <span>Showing {curr_page} of {total_pages}, items {((curr_page - 1) * per_page) + 1} to { Math.min(total_records, curr_page * per_page) } out of {total_records}.</span>
      <form method="get" action={curr_url.toString()}>
        <label>Jump to page: <input type="number" min="1" max={total_pages} name={query_param} value={curr_page} /></label>
        <button type="submit">Go</button>
      </form>
      {curr_page < total_pages && (
        <>
          <a href={setURLPageParam(curr_url, query_param, curr_page + 1)} class="q-next">next</a>
          <a href={setURLPageParam(curr_url, query_param, total_pages)} class="q-last">last</a>
        </>
      )}
    </div>
  );
};
