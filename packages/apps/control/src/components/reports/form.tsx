
import { FC } from "hono/jsx";
import { sub } from "date-fns";
import { toZonedDatetimeString, iana_timezones } from "@grovekit/utils";
import { AGGR_WINDOW, AGGR_OPS } from "@grovekit/database";

import { NULL_REPORT_ID, ReportParams, SERIES_STYLES } from "./types.js";
import { isNumericReport } from "./utils.js";


const getRangeQuickSelectURL = (base_url: URL | string, timezone: string, quantity: number, item: 'days' | 'hours' | 'minutes') => {
  const now = new Date();
  const to = toZonedDatetimeString(now, timezone);
  const from = toZonedDatetimeString(sub(now, { [item]: quantity }), timezone);
  const url = new URL(base_url);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  return url.toString();
};

export const ReportForm: FC<{ params: ReportParams, curr_url: URL | string }> = (props) => {
  const { params: { opts, series }, curr_url } = props;
  const is_numeric = isNumericReport(series);
  return (
    <form action={curr_url.toString()} method="get" class="q-chart-opts" style={{ maxWidth: '1120px', marginLeft: 'auto', marginRight: 'auto' }}>

      <input type="hidden" name="height" value={opts.height} />
      <input type="hidden" name="width" value={opts.width} />
      <input type="hidden" name="title" value={opts.title} />
      <input type="hidden" name="mode" value={opts.mode} />
      <input type="hidden" name="id" value={opts.id} />

      <fieldset>
        <legend>Time options</legend>

        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <label>from <input type="text" name="from" value={opts.from} /></label>
          </div>
          <div>
            <label>to <input type="text" name="to" value={opts.to} /></label>
          </div>
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <label>
              Timezone:
              <select name="timezone">
                {iana_timezones.map((tz) => {
                  return (<option key={tz} value={tz} selected={tz === opts.timezone}>{tz}</option>);
                })}
              </select>
            </label>
          </div>
          <div>
            <label>
              Refresh:
              <select name="autorefresh">
                <option value="true" selected={opts.autorefresh === 'true'}>enabled</option>
                <option value="false" selected={opts.autorefresh === 'false'}>disabled</option>
              </select>
            </label>
          </div>
          { is_numeric && (
            <div>
              <label>
                Aggregation window
                <select name="aggr_win">
                  <option value="none" selected={'none' === opts.aggr_win}>none</option>
                  {AGGR_WINDOW.map((win) => (<option value={win} selected={win === opts.aggr_win}>{win}</option>))}
                </select>
              </label>
            </div>
          ) }
          { !is_numeric && (
            <input type="hidden" name="aggr_win" value={opts.aggr_win} />
          ) }
        </div>

        <p>Quick select
          : <a href={getRangeQuickSelectURL(curr_url, opts.timezone, 15, 'minutes')}>last 15 minutes</a>
          , <a href={getRangeQuickSelectURL(curr_url, opts.timezone, 1, 'hours')}>last hour</a>
          , <a href={getRangeQuickSelectURL(curr_url, opts.timezone, 3, 'hours')}>last 3 hours</a>
          , <a href={getRangeQuickSelectURL(curr_url, opts.timezone, 6, 'hours')}>last 6 hours</a>
        </p>
      </fieldset>

      <fieldset>
        <legend>Series-specific options</legend>
        <table>
          <thead>
          <tr>
            <th>series</th>
            <th>color</th>
            <th>style</th>
            { is_numeric && (<th>aggr op</th>) }
            <th>remove</th>
          </tr>
          </thead>
          <tbody>
          {series.map((s, i) => (
            <tr>
              <td>
                <strong>{s.label}</strong>
                <input type="hidden" name={`series.${i}.property_id`} value={s.property_id} />
                <input type="hidden" name={`series.${i}.label`} value={s.label} />
                <input type="hidden" name={`series.${i}.aggr_unit`} value={s.aggr_unit} />
                <input type="hidden" name={`series.${i}.datatype`} value={s.datatype} />
              </td>
              <td>
                <input type="color" name={`series.${i}.color`} value={s.color} />
              </td>
              <td>
                <select name={`series.${i}.style`}>
                  {SERIES_STYLES.map((style) => (<option value={style} selected={style === s.style}>{style}</option>))}
                </select>
              </td>
              { is_numeric && (
                <td>
                  <select name={`series.${i}.aggr_op`}>
                    {AGGR_OPS.map((op) => (<option value={op} selected={op === s.aggr_op}>{op}</option>))}
                  </select>
                </td>
              ) }
              { !is_numeric && (
                <input type="hidden" name={`series.${i}.aggr_op`} value={s.aggr_op} />
              ) }
              <td>
                <input type="hidden" name={`series.${i}.delete`} value="false" />
                <input type="checkbox" name={`series.${i}.delete`} value="true" />
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </fieldset>
      <fieldset>
        <legend>Apply settings</legend>
        <ul class="q-unstyled-list">
          { opts.id !== NULL_REPORT_ID && (
            <>
              <li><button type="submit" name="save_on_apply" value="false">Apply without saving</button></li>
              <li><button type="submit" name="save_on_apply" value="true">Save and apply</button></li>
            </>
          )}
          { opts.id === NULL_REPORT_ID && (
            <>
              <li><button type="submit" name="save_on_apply" value="false">Apply</button></li>
            </>
          )}
        </ul>
      </fieldset>
    </form>
  );
};
