
import {
  DB,
  DatapointBoolean,
  DatapointFloat,
  DatapointInteger,
  DatapointString,
  DatapointJson,
  DatapointEnum,
  DatapointColor,
  DatapointDatetime,
  DatapointDuration,
  insertDatapointInteger,
  insertDatapointBoolean,
  insertDatapointEnum,
  insertDatapointFloat,
  insertDatapointString,
  insertDatapointJson,
} from "@grovekit/database";

import {
  BatchWorker,
} from '@grovekit/utils';

import Debug from 'debug';

const debug = Debug('grovekit:scribe:ingestor');

export class BatchDatapointIngestor {

  float: BatchWorker<DatapointFloat>;
  integer: BatchWorker<DatapointInteger>;
  boolean: BatchWorker<DatapointBoolean>;
  enum: BatchWorker<DatapointEnum>;
  string: BatchWorker<DatapointString>;
  json: BatchWorker<DatapointJson>;
  // color: BatchWorker<{ f: string, t: number, v: number }>;
  // datetime: BatchWorker<{ f: string, t: number, v: number }>;
  // duration: BatchWorker<{ f: string, t: number, v: number }>;


  constructor(db: DB) {

    this.float = new BatchWorker(async (batch) => {
      debug('batch ingesting %s float values', batch.length);
      await insertDatapointFloat(db, batch);
      debug('ingestion complete');
    });

    this.integer = new BatchWorker(async (batch) => {
      debug('batch ingesting %s integer values', batch.length);
      await insertDatapointInteger(db, batch);
      debug('ingestion complete');
    });

    this.boolean = new BatchWorker(async (batch) => {
      debug('batch ingesting %s boolean values', batch.length);
      await insertDatapointBoolean(db, batch);
      debug('ingestion complete');
    });

    this.enum = new BatchWorker(async (batch) => {
      debug('batch ingesting %s enum values', batch.length);
      await insertDatapointEnum(db, batch);
      debug('ingestion complete');
    });

    this.string = new BatchWorker(async (batch) => {
      debug('batch ingesting %s string values', batch.length);
      await insertDatapointString(db, batch);
      debug('ingestion complete');
    });

    this.json = new BatchWorker(async (batch) => {
      debug('batch ingesting %s json values', batch.length);
      await insertDatapointJson(db, batch);
      debug('ingestion complete');
    });

  }

}
