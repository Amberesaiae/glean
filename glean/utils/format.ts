/** Relative time like "3h", "2d", "just now". */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  return `${wk}w`;
}

/** Format an upcoming date like "Mon 23 Jun · 10:00". */
export function formatEventDate(ts: number): string {
  const d = new Date(ts);
  const day = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

/** Time of day like "10:00". */
export function formatEventTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Days until an upcoming timestamp. */
export function daysUntil(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Group thousands with commas for stat displays. */
export function groupNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Converts any unit count to kilograms based on standard conversions. */
export function convertToKg(quantity: number, unit: string): number {
  switch (unit) {
    case "kg":
      return quantity;
    case "bag-small":
      return quantity * 10;
    case "bag-medium":
    case "bags":
      return quantity * 25;
    case "bag-large":
      return quantity * 50;
    case "crate":
      return quantity * 15;
    case "bale":
      return quantity * 250;
    case "tons":
      return quantity * 1000;
    default:
      return quantity * 25; // default fallback (medium bag)
  }
}
