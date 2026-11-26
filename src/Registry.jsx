import { useState } from "react";
import { statuses, dayKey } from "./metrics.js";
export default function Registry({ entities }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [strikeOnly, setStrikeOnly] = useState(false);
  const [sort, setSort] = useState("oldest");
  const filtered = entities
    .filter(
      (e) =>
        (e.name + " " + e.owner)
          .toLowerCase()
          .includes(search.trim().toLowerCase()) &&
        (!type || e.type === type) &&
        (!status || e.status === status) &&
        (!strikeOnly || Number(e.strikes) > 0),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : (sort === "oldest" ? 1 : -1) * ((a.latest ?? 0) - (b.latest ?? 0)),
    );
  return (
    <section>
      <h2>
        Licensed entities{" "}
        <small>
          {filtered.length} of {entities.length}
        </small>
      </h2>
      <div className="controls">
        <label>
          Entity or owner
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Entity type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {[...new Set(entities.map((e) => e.type))].sort().map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Activity
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="oldest">Oldest activity first</option>
            <option value="recent">Latest activity first</option>
            <option value="name">Entity name</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={strikeOnly}
            onChange={(e) => setStrikeOnly(e.target.checked)}
          />
          With strikes
        </label>
      </div>
      <div className="registry">
        {filtered.map((e) => (
          <details key={e.id}>
            <summary>
              <span>
                <strong>{e.name}</strong>
                <small>
                  {e.type} · {e.owner || "Owner unknown"}
                </small>
              </span>
              <span className={"status s" + statuses.indexOf(e.status)}>
                {e.status}
              </span>
              <span>{e.latest ? dayKey(e.latest) : "Never recorded"}</span>
            </summary>
            <p>
              Last 7 days <b>{e.weekly}</b> · Change from prior 7 days{" "}
              <b>
                {e.change > 0 ? "+" : ""}
                {e.change}
              </b>{" "}
              · Strikes <b>{e.strikes}</b>
            </p>
            <p>
              {e.events.length} matched events · Average attendance {e.average}{" "}
              · Attendance reported for{" "}
              {e.events.filter((x) => x.attendance !== null).length} events
            </p>
            {e.events.length > 0 && (
              <div className="scroll">
                <table>
                  <caption>Matched event history · UTC</caption>
                  <thead>
                    <tr>
                      {["Date", "Type", "Host", "Attendees"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {e.events.map((x, i) => (
                      <tr key={i}>
                        <td>
                          {new Date(x.time)
                            .toISOString()
                            .slice(0, 16)
                            .replace("T", " ")}
                        </td>
                        <td>{x.type}</td>
                        <td>{x.host || "—"}</td>
                        <td>{x.attendance ?? "Unknown"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        ))}
      </div>
      {!filtered.length && <p>No entities match these filters.</p>}
    </section>
  );
}
