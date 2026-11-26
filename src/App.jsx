import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { bounds, DAY, registryMetrics, statuses, summarize } from './metrics.js';
import useReport from './useReport.js';
import './App.css';
const ReportTools = lazy(() => import('./ReportTools.jsx'));
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/90 border border-slate-700/60 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-slate-100 font-semibold text-sm">
          {`${payload[0].name} : `}
          <span className="text-amber-400 font-bold">
            {payload[0].payload.percentage !== undefined ? `${payload[0].payload.percentage}%` : `${payload[0].value} Entities`}
          </span>
        </p>
      </div>
    );
  }
  return null;
};
const getRelativeTimeString = (lastEventDate, now) => {
  if (!lastEventDate) return "No events recorded";

  const diffTime = now.getTime() - lastEventDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Just now";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "1 week ago";
  return `${diffWeeks} weeks ago`;
};
  const COLORS = ['#ad2831', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const statusStyles = {'Active': 'text-emerald-400 bg-emerald-950/20 border-emerald-800/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]', 'Early Inactivity': 'text-amber-400 bg-amber-950/20 border-amber-800/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]', 'Severe Inactivity': 'text-orange-500 bg-orange-950/20 border-orange-900/40 shadow-[0_0_8px_rgba(249,115,22,0.15)]', 'Inactive': 'text-rose-500 bg-rose-950/20 border-rose-900/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]'};
function trendStyle(change) {
 return change > 0 ? 'border-emerald-500/45 outline-emerald-500/15 ring-1 ring-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.28)]' : change < 0 ? 'border-rose-600/45 outline-rose-600/15 ring-1 ring-rose-600/5 shadow-[0_0_15px_rgba(225,29,72,0.28)]' : 'border-amber-500/25 outline-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.18)]';
}

function Countdown({checkedAt}) {
  const [now,setNow] = useState(Date.now);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()),1000);
    return () => clearInterval(interval);
  },[]);
  return Math.max(0,Math.ceil((checkedAt + 120000 - now)/1000));
}

export default function App() {
  const { report, now, error, refresh } = useReport();
  if (!report) {
    return (
      <div className="min-h-screen bg-[#1a0505] flex flex-col items-center justify-center text-[#fdfcf8] font-mono tracking-widest relative overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}logo1.png`}
          alt="Watermark Background"
          className="absolute w-96 h-96 sm:w-[600px] sm:h-[600px] object-contain opacity-5 blur-[1px] select-none pointer-events-none z-0"
        />
        <div className="flex flex-col items-center gap-4 z-10 bg-[#1a0505]/40 p-6 rounded-2xl backdrop-blur-md border border-red-950/20 shadow-[0_0_25px_rgba(173,40,49,0.25)]">
          <span className="h-7 w-7 border-2 border-t-[#ad2831] border-red-950/40 rounded-full animate-spin" />
          <span className="text-xs sm:text-sm font-black text-red-200 tracking-widest animate-pulse text-center">
            {error ? <button onClick={refresh}>{error} Retry</button> : 'LOADING ENTITY DASHBOARD...'}
          </span>
        </div>
      </div>
    );

  }
  return <Dashboard report={report} now={now} error={error} refresh={refresh}/>;
}

function Dashboard({report, now, error, refresh}) {
  const [searchTerm,setSearchTerm] = useState('');
  const [selectedType,setSelectedType] = useState('All');
  const [showAllHistory,setShowAllHistory] = useState(false);
  const [toolsOpen,setToolsOpen] = useState(false);
  const entities = useMemo(() => registryMetrics(report,now),[report,now]);
  const all = useMemo(() => summarize(report.events,bounds('all',[],now,report.events)),[report,now]);
  const recent = useMemo(() => summarize(report.events,bounds('14',[],now,report.events)),[report,now]);
  const weekly = useMemo(() => {
    const events = report.events.filter(e => e.time >= now-7*DAY && e.time <= now);
    return summarize(events,bounds('all',[],now,events));
  },[report,now]);
  const totalEventsCount = all.rows.length;
  const percent = (n,total) => (total ? 100*n/total : 0).toFixed(1);
  const modalEvent = all.types[0]?.name ?? 'N/A';
  const orderedTypes = useMemo(() => {
    const byName = new Map(all.types.map(type => [type.name, type]));
    return [...new Set(report.events.map(event => event.type))].map(name => byName.get(name));
  }, [report, all]);
  const pieChartData = orderedTypes.map((t,i) => ({name:t.name,value:t.count,percentage:percent(t.count,totalEventsCount),color:COLORS[i%COLORS.length]}));
  const retentionChartData = statuses.map((name,i) => ({name,value:entities.filter(e=>e.status===name).length,color:['#10b981','#f59e0b','#f97316','#ef4444'][i]}));
  const dayDistributionData = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((name,i)=>({name,count:all.weekdays[i],percentage:percent(all.weekdays[i],totalEventsCount)}));
  const weeklyHostLeaderboard = weekly.hosts.map(t=>({username:t.name,count:t.count}));
  const names = new Map(entities.map(e=>[e.id,e.name]));
  const weeklyEntityLeaderboard = weekly.entities.map(t=>({entityName:names.get(t.name),count:t.count}));
  const topWeeklyHoster = weeklyHostLeaderboard[0] ?? {username:'None',count:0};
  const topWeeklyEntity = weeklyEntityLeaderboard[0] ?? {entityName:'None',count:0};
  const topHosterPercentage = percent(topWeeklyHoster.count,weekly.rows.length);
  const topEntityPercentage = percent(topWeeklyEntity.count,weekly.rows.length);
  const displayedLineGraphData = showAllHistory ? all.timeline : recent.timeline;
  const distinctEntityTypes = ['All',...new Set(entities.map(e=>e.type))];
  const query = searchTerm.trim().toLowerCase();
  const filteredEntities = entities.filter(e=>(selectedType==='All' || selectedType===e.type) && (e.name.toLowerCase().includes(query) || e.owner.toLowerCase().includes(query)));
  return (
    <div className="min-h-screen bg-[#1a0505] text-[#fdfcf8] p-6 font-sans relative overflow-hidden">

      {/* Central Background Watermark Layer - Expanded Size and Enhanced Baseline Opacity */}
      <img
        src={`${import.meta.env.BASE_URL}logo1.png`}
        alt="Main Screen Watermark"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] sm:w-[800px] sm:h-[800px] object-contain opacity-[0.12] blur-[0.5px] select-none pointer-events-none z-0"
      />

      <div className="relative z-10">

        {/* Header Module */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b border-red-900/40 pb-5">
          <div className="min-w-[250px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ad2831] animate-pulse" />
              <h1 className="text-2xl font-black tracking-wider text-white uppercase">Entity Statistical Dashboard</h1>
            </div>
            <p className="text-xs text-red-300 mt-1">Ministry Of Labour - Bureau of Business Administration</p>
            <p className="text-[9px] text-slate-400 mt-1.5 tracking-wide italic">
              Credits: President1327, Zeus_Reality · <button className="underline" onClick={() => setToolsOpen(true)}>Reporting tools</button>
            </p>
          </div>

          <div className="flex justify-center items-center gap-5 my-2 sm:my-0">
            <img src={`${import.meta.env.BASE_URL}logo1.png`} alt="Logo 1" className="h-14 w-14 object-contain opacity-90" />
            <div className="h-8 w-[1.5px] bg-white/15 self-center" />
            <img src={`${import.meta.env.BASE_URL}bba-logo.png`} alt="BBA logo" className="h-14 w-14 object-contain opacity-90" />
          </div>

          <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 px-4 py-2 rounded-xl flex items-center justify-between sm:justify-end gap-4 min-w-[220px] shadow-[0_0_15px_rgba(173,40,49,0.2)]">
            <span className="text-xs font-mono text-red-400 uppercase tracking-widest">Next Dashboard Check In:</span>
            <span className="text-sm font-mono font-bold text-[#fdfcf8] bg-[#1a0505]/45 px-2.5 py-0.5 rounded border border-red-900/30"><Countdown checkedAt={now}/>s</span>
          </div>
        </div>

        {error && <p role="alert" className="text-amber-300">{error} Showing the last successful snapshot. <button onClick={refresh}>Retry</button></p>}
        {now-report.generatedAt > 3600000 && <p className="text-amber-300">Snapshot over one hour old.</p>}
        {toolsOpen && <Suspense fallback={<p>Loading reporting tools…</p>}><ReportTools report={report} now={now} entities={entities} refresh={refresh} onClose={() => setToolsOpen(false)}/></Suspense>}
        {/* Global Metric Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl shadow-[0_0_15px_rgba(173,40,49,0.22)]">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider block">Logged Events (All-Time)</span>
            <p className="text-4xl font-black text-white mt-1">{totalEventsCount}</p>
          </div>
          <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl shadow-[0_0_15px_rgba(173,40,49,0.22)]">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider block">Modal Event Type</span>
            <p className="text-xl font-black text-amber-400 mt-2 truncate">{modalEvent}</p>
            <span className="text-[10px] text-red-400 block mt-0.5">Most Event Hosted</span>
          </div>
          <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl shadow-[0_0_15px_rgba(173,40,49,0.22)]">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider block">TOTAL EVENT VARIANTS</span>
            <p className="text-4xl font-black text-blue-400 mt-1">{all.types.length}</p>
          </div>
        </div>

        {/* Tactical Spotlight Leaderboard Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div className="bg-[#2d080d]/40 backdrop-blur-md border-2 border-amber-500/20 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.25)]">
            <div className="absolute top-0 right-0 p-8 text-6xl text-amber-500/5 font-black uppercase pointer-events-none select-none font-mono">HOST</div>
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest font-mono">🥇 Weekly Top Hoster</span>
              <p className="text-xl font-black text-white mt-2 font-mono truncate" title={topWeeklyHoster.username}>{topWeeklyHoster.username}</p>
              <p className="text-xs text-amber-500/90 font-mono mt-1 font-semibold">
                 {topHosterPercentage}% of all events this week come from {topWeeklyHoster.username}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-3xl font-black text-amber-400 font-mono">{topWeeklyHoster.count}</span>
              <span className="text-[10px] block text-red-400 font-mono uppercase font-bold">Events Hosted</span>
            </div>
          </div>

          <div className="bg-[#2d080d]/40 backdrop-blur-md border-2 border-blue-500/20 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden shadow-[0_0_25px_rgba(59,130,246,0.25)]">
            <div className="absolute top-0 right-0 p-8 text-6xl text-blue-500/5 font-black uppercase pointer-events-none select-none font-mono">ENTITY</div>
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest font-mono">🏆 Weekly Top Entity</span>
              <p className="text-xl font-black text-white mt-2 font-mono truncate" title={topWeeklyEntity.entityName}>{topWeeklyEntity.entityName}</p>
              <p className="text-xs text-blue-400 font-mono mt-1 font-semibold">
                 {topEntityPercentage}% of all events this week come from {topWeeklyEntity.entityName}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-3xl font-black text-blue-400 font-mono">{topWeeklyEntity.count}</span>
              <span className="text-[10px] block text-red-400 font-mono uppercase font-bold">Logs Recorded</span>
            </div>
          </div>
        </div>

        {/* Turnout Averages Module */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-300 mb-3">Average Attendance Per Event Variant</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {orderedTypes.map((item, idx) => (
              <div key={idx} className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/35 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-[0_0_12px_rgba(173,40,49,0.18)]">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[11px] font-bold text-red-200 block truncate uppercase pr-1" title={item.name}>{item.name}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white font-mono">{item.average}</span>
                  <span className="text-[10px] text-red-400 font-medium">avg attendees</span>
                </div>
                <span className="text-[10px] text-red-400 font-mono mt-0.5 block">Reported: {item.known} / {item.count} events</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Operational Chart Layout */}
        <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl mb-6 shadow-[0_0_20px_rgba(173,40,49,0.25)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-200">Historical Event Frequency</h3>
            <div className="flex gap-1.5 bg-[#1a0505]/45 p-1 border border-red-900/30 rounded-xl font-mono text-[10px] shadow-[0_0_8px_rgba(173,40,49,0.15)]">
              <button aria-pressed={!showAllHistory} onClick={() => setShowAllHistory(false)} className={`px-3 py-1 rounded-lg font-bold uppercase ${!showAllHistory ? 'bg-[#ad2831]/70 text-white' : 'text-red-400'}`}>Recent (14d)</button>
              <button aria-pressed={showAllHistory} onClick={() => setShowAllHistory(true)} className={`px-3 py-1 rounded-lg font-bold uppercase ${showAllHistory ? 'bg-[#ad2831]/70 text-white' : 'text-red-400'}`}>All Time</button>
            </div>
          </div>
          <div className="h-44 w-full">
            {displayedLineGraphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={displayedLineGraphData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="eventGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ad2831" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ad2831" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4c1116" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#fdfcf8"
                    tick={{ fill: '#fdfcf8', opacity: 0.5 }}
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                    dy={10}
                  />
                  <YAxis
                    stroke="#fdfcf8"
                    tick={{ fill: '#fdfcf8', opacity: 0.5 }}
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(26,5,5,0.85)', borderColor: '#ad2831', color: '#fdfcf8', borderRadius: '8px', fontFamily: 'monospace' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#ad2831"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#eventGlow)"
                    dot={{ fill: '#ad2831', stroke: '#2d080d', strokeWidth: 1.5, r: 4 }}
                    activeDot={{ r: 6, stroke: '#fdfcf8', strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-red-400 italic">Compiling historical timeline matrix...</div>
            )}
          </div>
        </div>

        {/* Weekday Distribution Grid */}
        <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl mb-6 shadow-[0_0_20px_rgba(173,40,49,0.25)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-red-200 mb-3">Events Distribution Across The Week</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {dayDistributionData.map((day, idx) => (
              <div key={idx} className="bg-[#1a0505]/45 border border-red-900/30 p-3 rounded-xl text-center flex flex-col justify-between shadow-[0_0_10px_rgba(173,40,49,0.15)]">
                <span className="text-[11px] font-mono tracking-wider font-bold text-red-300 uppercase">{day.name}</span>
                <div className="my-2">
                  <span className="text-2xl font-black text-amber-400 font-mono">{day.percentage}%</span>
                </div>
                <span className="text-[10px] text-red-400 font-mono">{day.count} total events</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lower Main Quad-Column System Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Workspace 1: Analytical Proportions */}
          <div className="grid grid-cols-1 gap-4 h-[450px]">
            {/* Top Pie Proportion Chart */}
            <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-4 rounded-2xl flex items-center justify-between h-[218px] shadow-[0_0_15px_rgba(173,40,49,0.2)]">
              <div className="w-[45%] flex flex-col justify-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-200">Event Breakdown</h3>
                <p className="text-[9px] text-red-400 mt-0.5">Based on the percentage of all events.</p>
                <div className="mt-3 space-y-1 max-h-24 overflow-y-auto pr-1 text-[9px]">
                  {pieChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-red-300 truncate">{item.name}: {item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-[55%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45}>
                      {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Entity Health Proportions */}
            <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-4 rounded-2xl flex items-center justify-between h-[218px] shadow-[0_0_15px_rgba(173,40,49,0.2)]">
              <div className="w-[45%] flex flex-col justify-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-200">Entity Activity</h3>
                <p className="text-[9px] text-red-400 mt-0.5">Based on the licensed entity cards.</p>
                <div className="mt-3 space-y-1 max-h-24 overflow-y-auto pr-1 text-[9px]">
                  {retentionChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-red-300 truncate">{item.name}:</span>
                      <span className="text-white font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-[55%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie data={retentionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45}>
                      {retentionChartData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Workspace 2: Licensed Registry Ledger */}
          <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl h-[450px] flex flex-col shadow-[0_0_20px_rgba(173,40,49,0.25)]">
            <div className="mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-200 mb-2">Licenced Entities ({filteredEntities.length})</h3>
              <div className="flex flex-col gap-2">
                <input aria-label="Search entity or owner" type="text" placeholder="Search Entity / Owner..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1a0505]/45 border border-red-900/40 text-xs px-3 py-2 rounded-xl text-white placeholder-red-800/60 focus:outline-none shadow-[0_0_8px_rgba(173,40,49,0.15)]" />
                <select aria-label="Entity type" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full bg-[#1a0505]/45 border border-red-900/40 text-xs px-2 py-2 rounded-xl text-red-300 focus:outline-none font-mono cursor-pointer shadow-[0_0_8px_rgba(173,40,49,0.15)]">
                  {distinctEntityTypes.map((type, idx) => <option key={idx} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-1 flex-1">
              {filteredEntities.length > 0 ? (
                filteredEntities.map((entity) => (
                  <div key={entity.id} className={`bg-[#1a0505]/55 border outline p-3.5 rounded-xl transition-all duration-300 ${trendStyle(entity.change)}`}>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-bold text-white text-xs truncate tracking-wide">{entity.name}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-[#2d080d]/60 border border-red-900/40 text-red-300 flex-shrink-0">
                        {entity.type}
                      </span>
                    </div>

                    <div className="text-[10px] space-y-0.5 mb-2">
                      <p className="text-red-400 truncate">Owner: <span className="text-red-200 font-mono">{entity.owner}</span></p>
                      <p className="text-red-400">
                        Time Since Last Event: <span className="text-amber-400 font-semibold font-mono">{getRelativeTimeString(entity.latest ? new Date(entity.latest) : null, new Date(now))}</span>
                      </p>
                      <div className="pt-1.5">
                        <span className={`px-2 py-0.5 border text-[9px] font-mono rounded-md font-semibold tracking-wide ${statusStyles[entity.status]}`}>
                          {entity.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold font-mono tracking-wide mb-2 uppercase opacity-90">
                      <span className={entity.change > 0 ? 'text-emerald-400' : entity.change < 0 ? 'text-rose-500' : 'text-amber-400'}>
                        {entity.change === 0 ? '↔ No change this week' : (entity.change > 0 ? '▲ +' : '▼ ') + entity.change + ' events vs last week'}
                      </span>
                    </div>

                    <div className="bg-[#2d080d]/25 border border-red-900/30 rounded-lg p-2 mb-2.5 flex justify-between items-center text-center text-[10px] font-mono">
                      <div className="text-left">
                        <span className="text-red-400 block uppercase text-[8px]">7-Day Events</span>
                        <span className="text-emerald-400 font-bold text-xs">{entity.weekly} events</span>
                      </div>
                      <div className="text-right">
                        <span className="text-red-400 block uppercase text-[8px]">Total Events</span>
                        <span className="text-red-200 text-xs font-bold">{entity.events.length} events</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="bg-[#2d080d]/40 p-1.5 rounded border border-red-900/30 flex justify-between px-2 items-center">
                        <span className="text-red-400 uppercase text-[9px]">Avg Att:</span>
                        <span className="font-bold font-mono text-red-200">{entity.average}</span>
                      </div>
                      <div className="bg-[#2d080d]/40 p-1.5 rounded border border-red-900/30 flex justify-between px-2 items-center">
                        <span className="text-red-400 uppercase text-[9px]">Strikes:</span>
                        <span className={`font-bold font-mono ${parseFloat(entity.strikes) > 0 ? 'text-amber-500' : 'text-red-400'}`}>{entity.strikes}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-red-400 italic mt-8">No entities match your active filter inputs...</div>
              )}
            </div>
          </div>

          {/* Workspace 3: Internal Live Activity Records */}
          <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-4 rounded-2xl h-[450px] flex flex-col gap-4 shadow-[0_0_20px_rgba(173,40,49,0.25)]">
            <div className="flex flex-col h-[50%]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-200 mb-2">Weekly Top Hosters</h3>
              <div className="overflow-y-auto pr-1 flex-1 font-mono text-[11px] space-y-1">
                {weeklyHostLeaderboard.length > 0 ? (
                  weeklyHostLeaderboard.slice(0, 10).map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1a0505]/45 border border-red-900/30 p-1.5 rounded-lg shadow-[0_0_8px_rgba(173,40,49,0.12)]">
                      <span className="text-red-100 truncate">{idx + 1}. {user.username}</span>
                      <span className="text-amber-400 font-bold bg-amber-950/10 px-1.5 py-0.5 rounded text-[10px]">{user.count} events</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-red-400/60 italic p-2 text-center">No host operations tracked this week.</div>
                )}
              </div>
            </div>

            <div className="flex flex-col h-[50%] border-t border-red-900/30 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-200 mb-2">Weekly Active Entities</h3>
              <div className="overflow-y-auto pr-1 flex-1 font-mono text-[11px] space-y-1">
                {weeklyEntityLeaderboard.length > 0 ? (
                  weeklyEntityLeaderboard.slice(0, 10).map((entity, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1a0505]/45 border border-red-900/30 p-1.5 rounded-lg shadow-[0_0_8px_rgba(173,40,49,0.12)]">
                      <span className="text-red-100 truncate">{idx + 1}. {entity.entityName}</span>
                      <span className="text-blue-400 font-bold bg-blue-950/10 px-1.5 py-0.5 rounded text-[10px]">{entity.count} logs</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-red-400/60 italic p-2 text-center">No active entity sessions this week.</div>
                )}
              </div>
            </div>
          </div>

          {/* Workspace 4: Attendee Turnout Metrics */}
          <div className="bg-[#2d080d]/40 backdrop-blur-md border border-red-900/40 p-5 rounded-2xl h-[450px] flex flex-col shadow-[0_0_20px_rgba(173,40,49,0.25)]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-200 mb-3">Top Attending Attendees</h3>
            <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1 flex-1 font-mono text-xs">
              {report.topAttendees.length > 0 ? (
                report.topAttendees.slice(0, 10).map(([username,count], idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#1a0505]/45 border border-red-900/30 p-2.5 rounded-xl shadow-[0_0_8px_rgba(173,40,49,0.12)]">
                    <span className="text-slate-200 truncate">{idx + 1}. {username}</span>
                    <span className="text-red-400 font-bold text-[10px] bg-red-950/10 px-2 py-0.5 rounded-md border border-red-900/40">
                      {count} EVENTS
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-red-400 italic mt-8">No user attendance metrics compiled...</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
