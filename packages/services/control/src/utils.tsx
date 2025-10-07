
import { Logger } from 'pinetto';
import { Hono, type Context } from 'hono';
import { DB, SelectableDevice } from '@grovekit/database';
import { InlineMenuProps } from "./components/inline-menu.js";
import path from 'node:path';



// Hono bindings are not guaranteed to be set and should always
// allow for the possibility of being undefined.
export interface HonoBindings extends Record<string, unknown> {
}

// Hono variables are not guaranteed to be set and should always
// allow for the possibility of being undefined.
export interface HonoVariables extends Record<string, unknown> {
  db: DB;
  url: URL;
  logger: Logger;
  // user?: UserDetail;
  // session?: Session;
  tenant?: { id: string; name: string; };
}

export const package_path = path.resolve(import.meta.dirname, '..');

export const assets_path = path.resolve(package_path, 'assets');

export type HonoInstance = Hono<{ Bindings: HonoBindings, Variables: HonoVariables }>;

export type HonoContext = Context<{ Bindings: HonoBindings, Variables: HonoVariables }>;

export const padNumLeft = (num: number, max_len: number, fill_string: string = '0'): string => {
  return num.toString().padStart(max_len, fill_string);
};

export const getNumericQueryParam = (ctx: HonoContext, key: string, deflt: number, min: number, max: number): number => {
  let value = ctx.req.query(key) ?? deflt;
  if (typeof value === 'string') {
    value = parseInt(value);
    if (Number.isNaN(value) || value < min || value > max) {
      value = deflt;
    }
  }
  return value;
};

export const uniqueArray = <T extends any>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
};

export const getMainMenuItems = (ctx: HonoContext): InlineMenuProps['items'] => {
  return [
    { label: 'Devices', href: '/devices/list', active: ctx.get('url').pathname.startsWith('/devices') },
    { label: 'Reports', href: '/reports/list', active: ctx.get('url').pathname.startsWith('/reports') },
    { label: 'Alerts', href: '/alerts', active: ctx.get('url').pathname.startsWith('/alerts') },
    // { label: 'Settings', href: '/settings', active: ctx.get('url').pathname.startsWith('/settings') },
  ];
};


export const getDeviceMenuItems = (ctx: HonoContext, device: SelectableDevice, property_id?: string): InlineMenuProps['items'] => {
  const { pathname } = ctx.get('url');
  const alerts_count = device.open_alerts > 0
    ? <span class="q-alerts-count q-danger">{ device.open_alerts }</span>
    : <span class="q-alerts-count">{ device.open_alerts }</span>;
  return [
    { label: 'Info & Properties', href: `/devices/${device.id}`, active: pathname.endsWith(device.id) || !!(property_id && pathname.endsWith(property_id)) },
    { label: 'Logs', href: `/devices/${device.id}/logs`, active: pathname.endsWith('/logs') },
    { label: (<>Alerts {alerts_count}</>), href: `/devices/${device.id}/alerts`, active: pathname.endsWith('/alerts') },
  ];
};

export interface ListQueryParams<R, SK extends keyof R = keyof R> {
  order_by?: SK;
  order_dir?: 'asc' | 'desc';
  page?: number;
}
