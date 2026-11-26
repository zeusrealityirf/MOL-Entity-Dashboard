import test from "node:test";
import assert from "node:assert/strict";
import { buildReport, attendance, sheetTime } from "../scripts/report.js";
import {
  bounds,
  registryMetrics,
  summarize,
  exportSummary,
  DAY,
} from "../src/metrics.js";
const now = Date.UTC(2026, 10, 26, 12);
const header =
  'Timestamp,Username,Entity Name:,Type of Form,Event Type,"Usernames of attendees (Use "","" for each username)"';
const registry =
  "Strikes,Group ID,Licence Type,Licenced Entity Name,Entity Tracker LICENCED ENTITY OWNER\n0,1,Business,North,Owner\n1,2,Business,North Trading,Owner";
const row = (date, entity, type, people) =>
  [date, "Host", entity, "Event Logging", type, people].join(",");
const data = () =>
  buildReport(
    [
      header,
      row("26/11/2026", "North", "Other Event", '"Alice,ALICE, Bob"'),
      row("12/11/2026", "North Trading", "other event", "n/a"),
      row("01/01/2026", "West", "Other Event", "0"),
      row("31/02/2026", "North", "Other Event", ""),
      row("27/11/2026", "North", "Other Event", ""),
    ].join("\n"),
    registry,
    now,
  );
test("real headers, exact joins, quality counts and normalized attendance", () => {
  const r = data();
  assert.deepEqual(r.issues, { invalidDates: 2, unmatched: 1, ambiguous: 0 });
  assert.deepEqual(
    r.events.map((x) => [x.entityId, x.attendance]),
    [
      ["1", 2],
      ["2", null],
      [null, 0],
    ],
  );
  assert.equal(new Set(r.events.map((e) => e.type)).size, 1);
  assert.deepEqual(r.topAttendees, [
    ["alice", 1],
    ["bob", 1],
  ]);
  assert.deepEqual(attendance("15"), { count: 15, names: [] });
  assert.equal(attendance("n/a.").count, null);
});
test("malformed input cannot replace a snapshot", () => {
  assert.throws(
    () => buildReport("<html>error</html>", registry, now),
    /column/,
  );
  assert.throws(
    () =>
      buildReport(header, registry.replace("Strikes", "Something else"), now),
    /column/,
  );
  assert.ok(Number.isNaN(sheetTime("31/02/2026")));
});
test("name collisions are withheld and explicit aliases resolve historical names", () => {
  const r = buildReport(
    header +
      "\n" +
      row("25/11/2026", "North", "Test", "none") +
      "\n" +
      row("25/11/2026", "Former Name", "Test", "4"),
    registry + "\n0,3,Business,N-orth,Owner",
    now,
    { "Former Name": "2" },
  );
  assert.equal(r.issues.ambiguous, 1);
  assert.deepEqual(
    r.events.map((e) => e.entityId),
    [null, "2"],
  );
});
test("calendar gaps, inactive entities, attendance coverage, export", () => {
  const r = data(),
    range = bounds("14", [], now, r.events),
    stats = summarize(r.events, range);
  assert.equal(stats.timeline.length, 14);
  assert.equal(stats.timeline[0].date, "2026-11-13");
  assert.equal(stats.timeline[0].events, 0);
  assert.equal(stats.rows.length, 1);
  assert.equal(stats.types[0].average, "2.0");
  assert.deepEqual(
    registryMetrics(r, now).map((e) => e.status),
    ["Active", "Severe Inactivity"],
  );
  assert.match(exportSummary(r, stats, range), /2026-11-13/);
  assert.equal(summarize(r.events, ["2026-12-01", "2026-01-01"]), null);
});
test("rolling lifecycle cutoffs include their boundary", () => {
  for (const [days, expected] of [
    [7, "Active"],
    [14, "Early Inactivity"],
    [30, "Severe Inactivity"],
    [31, "Inactive"],
  ]) {
    const r = data();
    r.events = [{ ...r.events[0], time: now - days * DAY }];
    assert.equal(registryMetrics(r, now)[0].status, expected);
  }
});
