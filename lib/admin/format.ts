/**
 * Display formatting shared across the admin. Dates are handled as plain
 * `YYYY-MM-DD` strings so nothing shifts across a timezone boundary.
 */

const LOCALE = "en-GB";

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatLongDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** `14:30` -> `2:30 pm`. */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const suffix = hours < 12 ? "am" : "pm";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${`${minutes}`.padStart(2, "0")} ${suffix}`;
}

export function formatTimestamp(epochMs: number): string {
  return new Date(epochMs).toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(epochMs: number, now = Date.now()): string {
  const seconds = Math.round((epochMs - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["second", 60],
    ["minute", 60],
    ["hour", 24],
    ["day", 7],
    ["week", 4.35],
    ["month", 12],
    ["year", Number.POSITIVE_INFINITY],
  ];

  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  let value = seconds;
  for (const [unit, step] of units) {
    if (Math.abs(value) < step) return formatter.format(Math.round(value), unit);
    value /= step;
  }
  return formatter.format(Math.round(value), "year");
}

/** Time-of-day greeting for the dashboard heading. */
export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First name only, for the dashboard greeting. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** Digits-only WhatsApp target; local `0…` numbers become Ghana `233…`. */
export function whatsappDigits(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0/, "233");
}
