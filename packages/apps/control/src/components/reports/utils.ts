
import { ReportSeriesOpts } from "./types.js";

export const isNumericReport = (series: ReportSeriesOpts[]): boolean => {
  for (const s of series) {
    if (s.datatype !== 'float' && s.datatype !== 'integer') {
      return false;
    }
  }
  return true;
};
