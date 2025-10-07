
import { PartialReportParams, ReportOpts, ReportParams } from '../../components/reports/types.js';
import { unflattenReportParams } from './utils.js';
import { Frame } from '../../components/frame.js';
import { HonoInstance } from '../../utils.js';
import { is, ValidationErrorItem } from '@deepkit/type';
import { collectReportData } from './utils.js';
import { stringify } from 'csv-stringify/sync';


export const reportCSVController = (app: HonoInstance) => {

  app.get('/reports/csv', async (ctx) => {

    const curr_url = ctx.get('url');

    const params: PartialReportParams = { opts: {}, series: [] };

    unflattenReportParams(params, Object.fromEntries(curr_url.searchParams.entries()));

    if (!is<ReportParams>(params)) {
      return ctx.html(
        <Frame title='Time Chart'>
          <p>Bad options!</p>
          <pre>{}</pre>
        </Frame>
      );
    }

    const { opts, series } = params;

    const data = await collectReportData(ctx.get('db'), params);

    const out = stringify(data, {
      header: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      columns: [
        { key: 't', header: 'time' },
        ...series.map((s, i) => ({ key: `v${i + 1}`,  header: s.label })),
      ],
    });

    return ctx.text(out, 200, {
      'content-type': 'text/csv',
      'content-disposition': `attachment; filename="${opts.title}.csv"`
    });

  });

};
