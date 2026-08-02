import { toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@barapp/config";

/**
 * Devuelve el día de la semana (0=domingo..6=sábado) y "HH:mm" en America/Tijuana
 * para un instante UTC dado. La hora del dispositivo nunca se usa para promociones.
 */
export function toBusinessTimeParts(date: Date): { dayOfWeek: number; timeHHmm: string } {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  const dayOfWeek = zoned.getDay();
  const hh = String(zoned.getHours()).padStart(2, "0");
  const mm = String(zoned.getMinutes()).padStart(2, "0");
  return { dayOfWeek, timeHHmm: `${hh}:${mm}` };
}

export function nowUtc(): Date {
  return new Date();
}
