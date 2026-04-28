import { useEffect, useState } from 'react';
import { getAllVolunteers } from '../../services/firestore';
import { useFirestore } from '../../hooks/useFirestore';
import { Volunteer } from '../../types/volunteer.types';
import { SkeletonList } from '../../components/Common/LoadingSpinner';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const db = useFirestore();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'tasks' | 'reliability'>('tasks');

  useEffect(() => {
    getAllVolunteers(db).then(vols => {
      setVolunteers(vols);
      setLoading(false);
    });
  }, [db]);

  if (loading) return <SkeletonList count={5} />;

  const sorted = [...volunteers]
    .filter(v => v.tasksCompleted > 0 || v.reliabilityScore > 0)
    .sort((a, b) =>
      sortBy === 'tasks'
        ? b.tasksCompleted - a.tasksCompleted
        : b.reliabilityScore - a.reliabilityScore
    )
    .slice(0, 10);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-20 fade-in">
        <div className="text-5xl mb-3">🏆</div>
        <h3 className="text-lg font-semibold text-gray-700">No volunteer data yet</h3>
        <p className="text-gray-400 text-sm mt-1">Leaderboard will populate as volunteers complete tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🏆 Volunteer Leaderboard</h2>
          <p className="text-sm text-gray-500">Top performers across Maharashtra</p>
        </div>
        {/* Sort toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['tasks', 'reliability'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'tasks' ? '📋 Tasks' : '⭐ Reliability'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          {[sorted[1], sorted[0], sorted[2]].map((vol, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const heights = ['h-24', 'h-32', 'h-20'];
            const colors = ['bg-gray-100', 'bg-yellow-50 border-yellow-200', 'bg-orange-50 border-orange-200'];
            return (
              <div key={vol.uid} className={`${colors[i]} border rounded-2xl p-3 text-center flex flex-col items-center justify-end ${heights[i]}`}>
                <div className="text-2xl mb-1">{MEDALS[rank - 1]}</div>
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm mb-1">
                  {vol.name[0]}
                </div>
                <p className="text-xs font-bold text-gray-800 truncate w-full text-center">{vol.name.split(' ')[0]}</p>
                <p className="text-xs text-gray-500">
                  {sortBy === 'tasks' ? `${vol.tasksCompleted} tasks` : `${vol.reliabilityScore}%`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {sorted.map((vol, i) => {
          const maxVal = sortBy === 'tasks'
            ? Math.max(...sorted.map(v => v.tasksCompleted), 1)
            : 100;
          const val = sortBy === 'tasks' ? vol.tasksCompleted : vol.reliabilityScore;
          const pct = (val / maxVal) * 100;

          return (
            <div key={vol.uid}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${i < 3 ? 'bg-yellow-50/30' : ''}`}>
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {i < 3
                  ? <span className="text-xl">{MEDALS[i]}</span>
                  : <span className="text-sm font-bold text-gray-400">#{i + 1}</span>
                }
              </div>

              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 ${
                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-red-600'
              }`}>
                {vol.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{vol.name}</p>
                  {vol.isAvailable && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Available</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {vol.skills.slice(0, 3).map(s => (
                    <span key={s} className="text-xs text-gray-400">{s}</span>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-red-500'
                  }`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-gray-900">{val}</div>
                <div className="text-xs text-gray-400">{sortBy === 'tasks' ? 'tasks' : '%'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Showing top {sorted.length} of {volunteers.length} volunteers
      </p>
    </div>
  );
}
