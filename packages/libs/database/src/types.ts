
export interface SelectOpts<R extends {}, SK extends keyof R = keyof R> {
  offset?: number;
  limit?: number;
  order_by?: SK;
  order_dir?: 'asc' | 'desc';
}
