#!/usr/bin/env node
import { getDB } from '../client.js';
import { getDBOptsFromEnv } from '../config.js';
import { runAsyncMain  } from '@grovekit/utils';
import { selectFeedById } from '../tables/feeds.js';
import { queryMultiFeedWithAggregationColumnar } from '../services/multifeed.js';

runAsyncMain(async () => {

  const db = await getDB(getDBOptsFromEnv(process.env));

  const f1 = (await selectFeedById(db, 12))!;
  const f2 = (await selectFeedById(db, 18))!;

  // selectDatapointsFloatQuery(
  //   db,
  //   new Date(Date.now() - 1000 * 60 * 60 * 24).valueOf(),
  //   Date.now(),
  //   'asc',
  //   [{ feed_id: f1.id, datatype: f1.datatype }, { feed_id: f2.id, datatype: f2.datatype }],
  // );
  //
  const data = await queryMultiFeedWithAggregationColumnar(
    db,
    new Date(Date.now() - 1000 * 60 * 60 * 24).valueOf(),
    Date.now(),
    'asc',
    'day',
    [
      {
        feed_id: f1.id,
        datatype: f1.datatype as 'integer' | 'float',
        aggr_op: 'avg',
        aggr_unit: 'hour',
      },
      {
        feed_id: f2.id,
        datatype: f2.datatype as 'integer' | 'float',
        aggr_op: 'avg',
        aggr_unit: 'hour',
      },
    ],
  );

  console.dir(data);

});
