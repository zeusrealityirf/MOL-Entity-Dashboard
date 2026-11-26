export const DAY = 86400000;
export const dayKey = (time) => new Date(time).toISOString().slice(0, 10);
export const statuses = [
  "Active",
  "Early Inactivity",
  "Severe Inactivity",
  "Inactive",
];
export const average = (rows) => {
  const known = rows.filter((e) => e.attendance !== null);
  return known.length
    ? (known.reduce((sum, e) => sum + e.attendance, 0) / known.length).toFixed(
        1,
      )
    : "—";
};
export function registryMetrics(report, now) {
  const grouped = new Map();
  for (const event of report.events) {
    if (!grouped.has(event.entityId)) grouped.set(event.entityId, []);
    grouped.get(event.entityId).push(event);
  }
  return report.entities.map((entity) => {
    const events = (grouped.get(entity.id) || [])
      .slice()
      .sort((a, b) => b.time - a.time);
    const latest = events[0]?.time ?? null;
    const age = latest === null ? Infinity : (now - latest) / DAY;
    const status = statuses[age <= 7 ? 0 : age <= 14 ? 1 : age <= 30 ? 2 : 3];
    const weekly = events.filter((e) => e.time >= now - 7 * DAY).length;
    const previous = events.filter(
      (e) => e.time >= now - 14 * DAY && e.time < now - 7 * DAY,
    ).length;
    return {
      ...entity,
      events,
      latest,
      status,
      weekly,
      change: weekly - previous,
      average: average(events),
    };
  });
}
export function bounds(period, custom, now, events) {
  const today = dayKey(now);
  if (period === "custom") return custom;
  const start =
    period === "all"
      ? events.reduce((min, e) => Math.min(min, e.time), now)
      : now - (Number(period) - 1) * DAY;
  return [dayKey(start), today];
}
export function summarize(events, [start, end]) {
  if (!start || !end || start > end) return null;
  const from = Date.parse(start + "T00:00:00Z"),
    to = Date.parse(end + "T00:00:00Z");
  if (!Number.isFinite(from + to) || to - from > 36600 * DAY) return null;
  const rows = events.filter((e) => e.time >= from && e.time < to + DAY);
  const days = new Map();
  for (let t = from; t <= to; t += DAY) days.set(dayKey(t), 0);
  const weekdays = Array(7).fill(0);
  for (const event of rows) {
    const date = dayKey(event.time);
    days.set(date, days.get(date) + 1);
    weekdays[new Date(event.time).getUTCDay()]++;
  }
  return {
    rows,
    weekdays,
    timeline: Array.from(days, ([date, events]) => ({ date, events })),
    types: rank(rows, (e) => e.type),
    hosts: rank(rows, (e) => e.host),
    entities: rank(rows, (e) => e.entityId),
  };
}
function rank(rows, getKey) {
  const groups = new Map();
  for (const row of rows) {
    const key = getKey(row);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups]
    .map(([name, group]) => ({
      name,
      count: group.length,
      average: average(group),
      known: group.filter((e) => e.attendance !== null).length,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
export function exportSummary(report, summary, range) {
  const rows = [
    [
      "Start (UTC)",
      "End (UTC)",
      "Snapshot (UTC)",
      "Event type",
      "Events",
      "Attendance reported",
      "Average attendance",
    ],
  ];
  for (const t of summary.types)
    rows.push([
      ...range,
      new Date(report.generatedAt).toISOString(),
      t.name,
      t.count,
      t.known,
      t.average,
    ]);
  return rows
    .map((row) =>
      row
        .map((value) => {
          let field = String(value);
          if (/^[=+@\-\t\r]/.test(field)) field = "'" + field;
          return '"' + field.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
