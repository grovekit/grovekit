
import { Duration } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export type ZonedDatetimeString = `${number}-${number}-${number}T${number}:${number}:${number}`;

export type NowDatetimeString = 'now' | 'NOW';

export type NegativeTimeDeltaString = `-${number}${'y' | 'M' | 'w' | 'd' | 'm' | 'h' | 's' | 'ms'}`;

export const isNegTimeDeltaString = (val: string): val is NegativeTimeDeltaString => {
  return /^-\d+[yMwdhms]$/.test(val);
};

export const toZonedDatetimeString = (date: Date | number | string, timezone: string): ZonedDatetimeString => {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ss") as ZonedDatetimeString;
};

export const negTimeDeltaToDuration = (delta: NegativeTimeDeltaString): Duration => {
  const [_, sign, raw, unit] = delta.match(/(-)(\d+)([yMwdhms])/)!;
  const val = parseInt(raw);
  switch (unit) {
    case 'y': return { years: val };
    case 'M': return { months: val };
    case 'w': return { weeks: val };
    case 'd': return { days: val };
    case 'h': return { hours: val };
    case 'm': return { minutes: val };
    case 's': return { seconds: val };
    default:
      throw new Error(`Invalid unit: ${unit}`);
  }
};

export const iana_timezones = Intl.supportedValuesOf('timeZone');
iana_timezones.unshift('UTC');

export const local_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
