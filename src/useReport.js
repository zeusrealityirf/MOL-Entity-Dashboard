import { useCallback, useEffect, useState } from "react";
export default function useReport() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  const [now, setNow] = useState(Date.now);
  const refresh = useCallback(() => retry((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 30000);
    async function load() {
      try {
        const response = await fetch(import.meta.env.BASE_URL + "report.json", {
          cache: "no-cache",
          signal: controller.signal,
        });
        if (!response.ok) throw Error();
        const next = await response.json();
        if (
          next.version !== 1 ||
          !Number.isFinite(next.generatedAt) ||
          !Array.isArray(next.events) ||
          !Array.isArray(next.entities) ||
          !next.issues ||
          !Array.isArray(next.topAttendees)
        )
          throw Error();
        if (active) {
          setReport((old) =>
            old?.generatedAt === next.generatedAt ? old : next,
          );
          setError("");
        }
      } catch {
        if (active) setError("Could not load the latest reporting snapshot.");
      } finally {
        clearTimeout(timeout);
      }
    }
    load();
    const interval = setInterval(() => {
      setNow(Date.now());
      refresh();
    }, 120000);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [attempt, refresh]);
  return { report, error, now, refresh };
}
