import { writeFile, rename } from "node:fs/promises";
import { buildReport } from "./report.js";

const base =
  "https://docs.google.com/spreadsheets/d/1fXMteLyiV2Vld6k3EiFpq4QEblRPqJKaSkBKG0D4TTo/gviz/tq?tqx=out:csv&gid=";
async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error("Sheet returned HTTP " + response.status);
  return response.text();
}
const [events, entities] = await Promise.all([
  read(process.env.EVENTS_CSV_URL || base + "343677699"),
  read(process.env.ENTITIES_CSV_URL || base + "1543207625"),
]);
const report = buildReport(events, entities);
const target = new URL("../public/report.json", import.meta.url);
const temporary = new URL("../public/report.json.tmp", import.meta.url);
await writeFile(temporary, JSON.stringify(report));
await rename(temporary, target);
console.log(
  "Reporting snapshot generated:",
  report.events.length,
  "dated events,",
  report.entities.length,
  "entities",
);
