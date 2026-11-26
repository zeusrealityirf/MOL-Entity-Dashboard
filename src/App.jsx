import { useMemo } from "react";
import { registryMetrics, statuses } from "./metrics.js";
import useReport from "./useReport.js";
import Registry from "./Registry.jsx";
import Rankings from "./Rankings.jsx";
import Analytics from "./Analytics.jsx";
import "./App.css";
export default function App() {
  const { report, error, now, refresh } = useReport();
  const entities = useMemo(
    () => (report ? registryMetrics(report, now) : []),
    [report, now],
  );
  return (
    <main>
      <header>
        <img alt="" src={import.meta.env.BASE_URL + "bba-logo.png"} />
        <div>
          <p>Ministry of Labour · Bureau of Business Administration</p>
          <h1>Entity Statistical Dashboard</h1>
        </div>
      </header>
      {error && (
        <p role="alert">
          {error} {report && "Showing the last successful snapshot."}{" "}
          <button onClick={refresh}>Retry</button>
        </p>
      )}
      {!report && !error && <p role="status">Loading entity records…</p>}
      {report && (
        <>
          <div className="updated">
            Last successful snapshot ·{" "}
            {new Date(report.generatedAt)
              .toISOString()
              .slice(0, 16)
              .replace("T", " ")}{" "}
            UTC
            {now - report.generatedAt > 3600000 && (
              <b> · Snapshot over one hour old</b>
            )}{" "}
            <button onClick={refresh}>Refresh</button>
          </div>
          <div className="tiles">
            {statuses.map((s, i) => (
              <div key={s}>
                <strong>{entities.filter((e) => e.status === s).length}</strong>
                <span className={"status s" + i}>{s}</span>
              </div>
            ))}
          </div>
          <Registry entities={entities} />
          <Analytics report={report} now={now} />
          <section>
            <h2>
              Reporting quality <small>All time</small>
            </h2>
            <p>
              {report.events.length} dated events ·{" "}
              {report.events.filter((e) => e.attendance !== null).length} with
              usable attendance · {report.issues.invalidDates} invalid or future
              dates excluded
            </p>
            <p>
              {report.issues.unmatched} events without a registry match ·{" "}
              {report.issues.ambiguous} ambiguous matches
            </p>
            <details>
              <summary>Attendance leaderboard · all time</summary>
              <Rankings
                title="Most events attended by named attendees"
                rows={report.topAttendees}
              />
            </details>
          </section>
        </>
      )}
      <footer>Dashboard by President1327 and Zeus_Reality</footer>
    </main>
  );
}
