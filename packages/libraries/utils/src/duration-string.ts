

import { add, Duration, sub } from 'date-fns';

export type DurationStringUnit =
  | 'second' | 'seconds'
  | 'minute' | 'minutes'
  | 'hour'   | 'hours'
  | 'day'    | 'days'
  | 'month'  | 'months'
  | 'year'   | 'years'
  ;

//
// DURATION STRING
//

export type DurationString = `${number} ${DurationStringUnit}`;

export const duration_string_pattern = '(\\d{1,3})\\s?((?:second|minute|hour|day|week|month|year)s?)';

export const duration_string_regexp = new RegExp(`^${duration_string_pattern}$`);

export const parseDurationString = (duration_string: DurationString): Duration => {
  const match = duration_string.match(duration_string_regexp);
  if (match) {
    return { [match[2].replace(/s?$/, 's') as keyof Duration]: parseInt(match[1]) };
  }
  throw new Error('bad interval');
};

//
// TIME RELATIVE TO NOW STRING
//

export type RelativeTimeString = `now` | `now ${'+'|'-'} ${DurationString}`;

export const relative_time_string_pattern = 'now(?:\\s?([+-])\\s?(\\d{1,3})\\s?((?:second|minute|hour|day|week|month|year)s?))';

export const relative_time_string_regexp = new RegExp(`^${relative_time_string_pattern}$`);

export const applyRelativeTimeString = (rel_time_string: string, now: Date): Date => {
  if (rel_time_string === 'now') {
    return new Date(now);
  }
  const match = rel_time_string.match(relative_time_string_regexp);
  if (match) {
    const duration = { [match[3].replace(/s?$/, 's') as keyof Duration]: parseInt(match[2]) };
    const op = match[1] === '+' ? add : sub;
    return op(now, duration);
  }
  throw new Error('bad interval');
};

//
// LOCAL TIME STRING
//

export type LocalTimeString = string & { _local_time_string: true };

export const local_time_string_pattern = '\\d\\d\\d\\d-\\d\\d-\\d\\d[\\sT]\\d\\d:\\d\\d(?::\\d\\d)?';
