import { useState, useEffect } from 'react';
import Navbar from '../../components/Layout/Navbar';
import NeedsList from './NeedsList';
import ActiveTasks from './ActiveTasks';
import CreateNeed from './CreateNeed';
import Analytics from './Analytics';
import NeedsMap from './NeedsMap';
import Forecast from './Forecast';
import Leaderboard from './Leaderboard';
import { useNeeds } from '../../hooks/useNeeds';
import { useTasks } from '../../hooks/useTasks';
import { getAllVolunteers } from '../../services/firestore';
import { useFirestore } from '../../hooks/useFirestore';

type Tab = 'needs' | 'tasks' | 'create' | 'analytics' | 'map' | 'forecast' | 'leaderboard';

// ── Summary header — always visible above tabs ────────────────────────────────
function SummaryHeader() {
  const { needs } = useNeeds();
  const { tasks } = useTasks();
  const db = useFirestore();
  const [availableVols, setAvailableVols] = useState(0);

  useEffect(() => {
    getAllVolunteers(db).then(vols => {
      setAvailableVols(vols.filter(v => v.isAvailable).length);
    });
  }, [db]);

  const critical   = needs.filter(n => (n.urgencyScore ?? 0) >= 75).length;
  const pending    = tasks.filter(t => t.status === 'open' || t.status === 'assigned').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;

  const stats = [
    { label: 'Critical Needs',       value: critical,      color: 'bg-red-50 border-red-200 text-red-700',       icon: '🚨', pulse: critical > 0 },
    { label: 'Pending Tasks',         value: pending,       color: 'bg-orange-50 border-orange-200 text-orange-700', icon: '⏳', pulse: false },
    { label: 'In Progress',           value: inProgress,    color: 'bg-blue-50 border-blue-200 text-blue-700',     icon: '▶️', pulse: false },
    { label: 'Available Volunteers',  value: availableVols, color: 'bg-green-50 border-green-200 text-green-700',  icon: '🙋', pulse: false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, color, icon, pulse }) => (
        <div key={label} className={`rounded-2xl border p-4 ${color} flex items-center gap-3`}>
          <div className="relative shrink-0">
            <span className="text-2xl">{icon}</span>
            {pulse && value > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-xs font-medium opacity-80 leading-tight">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function CoordinatorDashboard() {
  const [tab, setTab] = useState<Tab>('needs');

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'needs',        label: 'Needs Dashboard', icon: '⚠️' },
    { key: 'tasks',        label: 'Active Tasks',    icon: '📋' },
    { key: 'map',          label: 'Map',             icon: '🗺️' },
    { key: 'forecast',     label: 'Forecast',        icon: '🔮' },
    { key: 'leaderboard',  label: 'Leaderboard',     icon: '🏆' },
    { key: 'create',       label: 'Report Need',     icon: '➕' },
    { key: 'analytics',    label: 'Analytics',       icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Summary header — always visible */}
        <SummaryHeader />

        {/* Tab bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6 flex gap-1 overflow-x-auto">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 py-2.5 px-3 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-150 flex-1 justify-center ${
                tab === key
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{icon}</span>
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="fade-in" key={tab}>
          {tab === 'needs'        && <NeedsList />}
          {tab === 'tasks'        && <ActiveTasks />}
          {tab === 'map'          && <NeedsMap />}
          {tab === 'forecast'     && <Forecast />}
          {tab === 'leaderboard'  && <Leaderboard />}
          {tab === 'create'       && <CreateNeed onCreated={() => setTab('needs')} />}
          {tab === 'analytics'    && <Analytics />}
        </div>
      </div>
    </div>
  );
}
