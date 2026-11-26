import { useEffect, useRef } from 'react';
import Analytics from './Analytics.jsx';
import Registry from './Registry.jsx';

export default function ReportTools({report, entities, now, refresh, onClose}) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog ref={dialog} className="report-tools" aria-labelledby="tools-title" onClose={onClose}>
    <div className="flex items-center justify-between gap-4">
      <h2 id="tools-title">Reporting tools</h2>
      <button onClick={() => dialog.current.close()}>Close</button>
    </div>
    <p>Snapshot · {new Date(report.generatedAt).toISOString().slice(0,16).replace('T',' ')} UTC <button onClick={refresh}>Refresh</button></p>
    <p>{report.events.filter(e => e.attendance !== null).length} of {report.events.length} events with usable attendance · {report.issues.invalidDates} invalid or future dates excluded · {report.issues.unmatched} unmatched · {report.issues.ambiguous} ambiguous</p>
    <Registry entities={entities}/><Analytics report={report} now={now}/>
  </dialog>;
}
