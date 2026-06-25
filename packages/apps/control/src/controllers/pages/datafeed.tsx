
import { Client } from "@grovekit/homie-client";
import { HonoInstance, prettyRawValue } from "../../utils.js";
import { SSEStreamingApi, streamSSE } from "hono/streaming";
import { is } from "@runtyped/type";
import { Deferred } from "@grovekit/utils";
import { LRUCache } from "lru-cache";
import { DB, FeedType, SelectableFeed, selectFeedByTypeAndTopic } from "@grovekit/database";

interface DatafeedParams {
  topics: string[];
}

export const datafeedController = (app: HonoInstance, client: Client, db: DB) => {

  // TODO: make options configurable
  const feeds = new LRUCache<string, SelectableFeed>({
    max: 100_000,
    ttl: 60_000,
  });

  const streams_by_topic = new Map<string, Set<SSEStreamingApi>>();

  client.subscribeToPropertyValue({
    prefix: '+',
    type: 'property_value',
    node: '+',
    property: '+',
    device: '+',
  });

  client.handlePropertyValue = async (topic, value) => {
    let feed = feeds.get(topic.raw);
    if (!feed) {
      feed = await selectFeedByTypeAndTopic(db, FeedType.PROPERTY_VALUE, topic.raw);
      if (!feed) {
        return;
      }
      feeds.set(topic.raw, feed);
    }
    const streams = streams_by_topic.get(topic.raw);
    if (streams) {
      const event = {
        data: JSON.stringify({
          topic: topic.raw,
          value: prettyRawValue(value, feed.datatype),
        }),
      };
      await Promise.all(Array.from(streams, (stream) => stream.writeSSE(event)));
    }
  };

  app.get('/datafeed', async (ctx) => {

    const params = {
      topics: ctx.req.queries('topic'),
    };

    if (!is<DatafeedParams>(params)) {
      return ctx.json({ error: 'Invalid parameters' }, 400);
    }

    const { topics } = params;

    const deferred = new Deferred<void>();

    const cleanup = (stream: SSEStreamingApi) => {
      for (const topic of topics) {
        const streams = streams_by_topic.get(topic);
        if (streams) {
          streams.delete(stream);
          if (streams.size === 0) {
            streams_by_topic.delete(topic);
          }
        }
      }
      deferred.resolve();
    };

    const onStream = async (stream: SSEStreamingApi) => {
      stream.onAbort(() => cleanup(stream));
      for (const topic of topics) {
        let streams = streams_by_topic.get(topic);
        if (!streams) {
          streams = new Set();
          streams_by_topic.set(topic, streams);
        }
        streams.add(stream);
      }
      await deferred.promise;
    };

    const onError = async (err: Error, stream: SSEStreamingApi) => {
      cleanup(stream);
      // TODO: better logging
      console.error('SSE error:', err);
    };

    return streamSSE(ctx, onStream, onError);
  });



};
