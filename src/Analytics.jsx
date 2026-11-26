import { lazy, Suspense, useMemo, useState } from "react";
import { bounds, exportSummary, summarize } from "./metrics.js";
import Rankings from "./Rankings.jsx";
const EventChart = lazy(() => import("./EventChart.jsx"));
export default function Analytics({ report, now }) {
  const [period, setPeriod] = useState("14");
  const [custom, setCustom] = useState(() => bounds("14", [], now, []));
  const range = useMemo(
    () => bounds(period, custom, now, report.events),
    [period, custom, now, report],
  );
  const stats = useMemo(() => summarize(report.events, range), [report, range]);
  const names = new Map(report.entities.map((e) => [e.id, e.name]));
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportSummary(report, stats, range)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mol-events-" + range.join("_") + ".csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section>
      <h2>Event analytics</h2>
      <div className="controls">
        <label>
          Reporting period · UTC
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {[
              ["7", "Last 7 days"],
              ["14", "Last 14 days"],
              ["30", "Last 30 days"],
              ["all", "All time"],
              ["custom", "Custom dates"],
            ].map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {period === "custom" &&
          ["Start", "End"].map((label, i) => (
            <label key={label}>
              {label}
              <input
                type="date"
                value={custom[i]}
                onChange={(e) =>
                  setCustom(
                    custom.map((v, j) => (i === j ? e.target.value : v)),
                  )
                }
              />
            </label>
          ))}
        <button disabled={!stats} onClick={download}>
          Export summary CSV
        </button>
      </div>
      {!stats ? (
        <p role="alert">Choose a valid reporting interval.</p>
      ) : (
        <>
          <p>
            {range.join(" to ")} · {stats.rows.length} events ·{" "}
            {stats.types.length} event types · Most common event type:{" "}
            {stats.types[0]?.name ?? "—"}
          </p>
          {!stats.rows.length && <p>No events logged in this period.</p>}
          <h3>Daily event frequency</h3>
          <div className="chart">
            <Suspense fallback={<p>Loading chart…</p>}>
              <EventChart timeline={stats.timeline} />
            </Suspense>
          </div>
          <details>
            <summary>Daily counts</summary>
            <div className="scroll">
              <table>
                <tbody>
                  {stats.timeline.map((t) => (
                    <tr key={t.date}>
                      <th>{t.date}</th>
                      <td>{t.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="ranks">
            <Rankings
              title="Leading hosts"
              rows={stats.hosts.map((x) => [x.name, x.count])}
            />
            <Rankings
              title="Leading entities"
              rows={stats.entities.map((x) => [names.get(x.name), x.count])}
            />
          </div>
          <details>
            <summary>Event types and attendance</summary>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Type",
                      "Events",
                      "Share",
                      "Attendance reported",
                      "Average attendees",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.types.map((t) => (
                    <tr key={t.name}>
                      <th>{t.name}</th>
                      <td>{t.count}</td>
                      <td>
                        {((100 * t.count) / stats.rows.length).toFixed(1)}%
                      </td>
                      <td>
                        {t.known} / {t.count}
                      </td>
                      <td>{t.average}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>Weekday distribution</summary>
            <ol>
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((d, i) => (
                <li key={d}>
                  {d}
                  <b>{stats.weekdays[i]}</b>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
    </section>
  );
}
