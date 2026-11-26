const parseFullCSV = (text) => {
  const lines = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field.trim());
    lines.push(row);
  }
  if (inQuotes) throw new Error("Unclosed CSV field");
  return lines;
};

const key = (value) => value.trim().toLowerCase().replace(/\s+/g, " ");
const entityKey = (value) =>
  key(value)
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]/gu, "");
const columns = {
  timestamp: ["timestamp"],
  host: ["username", "host", "hosted by"],
  entity: ["entity name", "entity"],
  form: ["type of form", "form type"],
  type: ["event type", "type of event"],
  attendance: ["usernames of attendees", "attendees"],
};
const registry = {
  name: ["licenced entity name", "licensed entity name"],
  owner: ["licensed entity owner", "licenced entity owner"],
  id: ["group id"],
  strikes: ["strikes"],
  type: ["licence type", "license type"],
};
function records(csv, schema) {
  const [header, ...rows] = parseFullCSV(csv);
  const names = (header ?? []).map((h) =>
    key(h)
      .replace(/^entity tracker\s+/, "")
      .replace(/\s*\(.*$/, "")
      .replace(/:$/, "")
      .trim(),
  );
  const fields = Object.entries(schema).map(([field, aliases]) => {
    const matches = names.flatMap((name, i) =>
      aliases.includes(name) ? [i] : [],
    );
    if (matches.length !== 1)
      throw new Error("Missing or ambiguous column: " + field);
    return [field, matches[0]];
  });
  return rows.map((row) =>
    Object.fromEntries(fields.map(([field, i]) => [field, row[i] || ""])),
  );
}

export function sheetTime(value) {
  const match =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      value,
    );
  if (!match) return NaN;
  const [d, m, y, h, min, s] = match.slice(1).map((v) => Number(v || 0));
  const time = Date.UTC(y, m - 1, d, h, min, s);
  const date = new Date(time);
  return date.getUTCDate() === d &&
    date.getUTCMonth() === m - 1 &&
    h < 24 &&
    min < 60 &&
    s < 60
    ? time
    : NaN;
}

export function attendance(value) {
  const raw = key(value);
  if (/^(none|no attendees|0)$/.test(raw)) return { count: 0, names: [] };
  if (/^\d{1,4}$/.test(raw)) return { count: Number(raw), names: [] };
  if (!raw || /^(n\/?a\.?|unknown|nil|no|-)$/i.test(raw))
    return { count: null, names: [] };
  const tokens = raw
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((t) => t.replace(/^@/, ""));
  if (!tokens.length || tokens.some((t) => !/^[a-z0-9_]{3,20}$/.test(t)))
    return { count: null, names: [] };
  const names = [...new Set(tokens)];
  return { count: names.length, names };
}

export function buildReport(
  eventsCsv,
  entitiesCsv,
  now = Date.now(),
  aliases = {},
) {
  const entities = records(entitiesCsv, registry)
    .filter((r) => r.name)
    .map((r, i) => ({
      id: r.id || "registry-" + i,
      name: r.name,
      owner: r.owner,
      type: r.type || "Unknown",
      strikes: r.strikes || "0",
    }));
  if (new Set(entities.map((e) => e.id)).size !== entities.length)
    throw new Error("Duplicate entity ID");
  const index = new Map();
  function register(label, id) {
    if (!label) return;
    const normalized = entityKey(label);
    const matches = index.get(normalized) || new Set();
    matches.add(id);
    index.set(normalized, matches);
  }
  for (const entity of entities) {
    register(entity.name, entity.id);
    register(entity.id, entity.id);
  }
  for (const [label, id] of Object.entries(aliases)) {
    if (!entities.some((e) => e.id === id))
      throw new Error("Unknown alias target");
    register(label, id);
  }
  const issues = { invalidDates: 0, unmatched: 0, ambiguous: 0 };
  const attendees = new Map(),
    types = new Map(),
    events = [];
  for (const row of records(eventsCsv, columns)) {
    if (!key(row.form).includes("event logging") || !row.type) continue;
    const time = sheetTime(row.timestamp);
    if (!Number.isFinite(time) || time > now) {
      issues.invalidDates++;
      continue;
    }
    const matches = index.get(entityKey(row.entity));
    const entityId = matches?.size === 1 ? [...matches][0] : null;
    if (!entityId) issues[matches?.size ? "ambiguous" : "unmatched"]++;
    const { count, names } = attendance(row.attendance);
    for (const name of names)
      attendees.set(name, (attendees.get(name) || 0) + 1);
    const typeKey = key(row.type);
    if (!types.has(typeKey)) types.set(typeKey, row.type);
    events.push({
      time,
      entityId,
      type: types.get(typeKey),
      host: row.host,
      attendance: count,
    });
  }
  const topAttendees = [...attendees]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10);
  return {
    version: 1,
    generatedAt: now,
    entities,
    events,
    issues,
    topAttendees,
  };
}
