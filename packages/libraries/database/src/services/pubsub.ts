
import { is, ReceiveType, resolveReceiveType } from "@deepkit/type";
import { DB, ___getPostgresClient } from "../client.js";
import { RawValue } from '@grovekit/homie-core';


interface SubscriptionCallback<T> {
  (message: T): Promise<any>;
}

interface Subscription {
  unsubscribe(): void;
}

const subscribe = async <T>(db: DB, channel: string, callback: SubscriptionCallback<T>, type?: ReceiveType<T>): Promise<Subscription> => {
  type = resolveReceiveType(type);
  const postgres = ___getPostgresClient(db);
  const meta = await postgres.listen(channel, async (message) => {
    const parsed = JSON.parse(message);
    if (is<T>(parsed, undefined, undefined, type)) {
      await callback(parsed);
    }
  });
  const unsubscribe = () => {
    meta.unlisten();
  };
  return { unsubscribe };
};

const publish = async (db: DB, channel: string, message: any) => {
  const postgres = ___getPostgresClient(db);
  await postgres.notify(channel, JSON.stringify(message));
};

export interface PropertySetReq {
  topic: string;
  value: RawValue;
}

export const subscribeToPropertySetRequests = async (db: DB, callback: SubscriptionCallback<PropertySetReq>) => {
  return await subscribe<PropertySetReq>(db, 'property_set_requests', callback);
};

export const publishPropertySetRequest = async (db: DB, req: PropertySetReq) => {
  await publish(db, 'property_set_requests', req);
};
