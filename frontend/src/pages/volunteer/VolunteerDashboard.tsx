import { useState } from 'react';
import Navbar from '../../components/Layout/Navbar';
import TaskList from './TaskList';
import VolunteerProfile from './VolunteerProfile';
import ImpactDashboard from './ImpactDashboard';
import RouteOptimizer from './RouteOptimizer';
import NeedsMap from '../coordinator/NeedsMap';
import { useAuth } from '../../hooks/useAuth';

type Tab = 'tasks' | 'map' | 'route' | 'impact' | 'profile';

export default function VolunteerDashboard() {
  const [tab, setTab] = useState<Tab>('tasks');
  const { user } = useAuth();

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'tasks',   icon: '📋', label: 'My Tasks' },
    { key: 'map',     icon: '🗺️', label: 'Map' },
    { key: 'route',   icon: '🛣️', label: 'Route' },
    { key: 'impact',  icon: '🏆', label: 'My Impact' },
    { key: 'profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6 flex gap-1">
          {tabs.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-semibold rounded-xl flex-1 transition-all duration-150 ${
                tab === key ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="fade-in" key={tab}>
          {tab === 'tasks'   && user && <TaskList uid={user.uid} />}
          {tab === 'map'     && <NeedsMap />}
          {tab === 'route'   && user && <RouteOptimizer uid={user.uid} />}
          {tab === 'impact'  && user && <ImpactDashboard uid={user.uid} />}
          {tab === 'profile' && user && <VolunteerProfile uid={user.uid} />}
        </div>
      </div>
    </div>
  );
}
