import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@barapp/config";
import type { ReportsRangeQuery } from "@barapp/contracts";

export function resolveDateRange(query: ReportsRangeQuery): { from: Date; to: Date } {
  if (query.preset === "CUSTOM" && query.from && query.to) {
    return { from: new Date(query.from), to: new Date(query.to) };
  }

  const nowInTz = toZonedTime(new Date(), APP_TIMEZONE);
  const dayOffset = query.preset === "YESTERDAY" ? -1 : 0;
  const targetDay = new Date(nowInTz);
  targetDay.setDate(targetDay.getDate() + dayOffset);

  const startOfDayLocal = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 0, 0, 0);
  const endOfDayLocal = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59, 999);

  return {
    from: fromZonedTime(startOfDayLocal, APP_TIMEZONE),
    to: fromZonedTime(endOfDayLocal, APP_TIMEZONE),
  };
}
