import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNeeds } from '../../hooks/useNeeds';
import { useFirestore } from '../../hooks/useFirestore';
import { updateDoc, doc } from 'firebase/firestore';
import UrgencyBadge from '../../components/Dashboard/UrgencyBadge';
import ScoreBreakdown from '../../components/Dashboard/ScoreBreakdown';
import { SkeletonList } from '../../components/Common/LoadingSpinner';
import { formatDate, formatCategory } from '../../utils/formatters';
import { computeUrgencyScore } from '../../utils/mlEngine';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CATEGORY_ICONS: Record<string, string> = {
  medical: '🏥', shelter: '🏠', food_distribution: '🍱',
  education: '📚', water_sanitation: '💧', general: '📋',
};

const FILTERS = ['all', 'medical', 'shelter', 'food_distribution', 'education', 'water_sanitation'] as const;

export default function NeedsList() {
  const { needs, loading } = useNeeds();
  const navigate = useNavigate();
  const db = useFirestore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);

  async function handleResolve(needId: string) {
    setResolving(needId);
    try {
      await updateDoc(doc(db, 'needs', needId), { status: 'resolved' });
      toast.success('Need marked as resolved');
    } catch {
      toast.error('Failed to resolve need');
    }
    setResolving(null);
  }

  // Recompute urgency score for needs that have score=0 (created via console or old data)
  // and patch Firestore so it's correct going forward
  function getEffectiveScore(need: any) {
    if (need.urgencyScore && need.urgencyScore > 0) return need.urgencyScore;
    const daysAgo = need.createdAt instanceof Timestamp
      ? Math.floor((Date.now() - need.createdAt.toDate().getTime()) / 86400000)
      : 0;
    const result = computeUrgencyScore(
      need.reportedCount ?? 1,
      need.severity ?? 'medium',
      daysAgo,
      need.category ?? 'general'
    );
    // Patch Firestore silently so it's correct next time
    if (need.needId) {
      updateDoc(doc(db, 'needs', need.needId), {
        urgencyScore: result.score,
        scoreBreakdown: result.breakdown,
      }).catch(() => {});
    }
    return result.score;
  }

  function getEffectiveBreakdown(need: any) {
    if (need.scoreBreakdown && Object.keys(need.scoreBreakdown).length > 0) return need.scoreBreakdown;
    const daysAgo = need.createdAt instanceof Timestamp
      ? Math.floor((Date.now() - need.createdAt.toDate().getTime()) / 86400000)
      : 0;
    return computeUrgencyScore(
      need.reportedCount ?? 1,
      need.severity ?? 'medium',
      daysAgo,
      need.category ?? 'general'
    ).breakdown;
  }

  if (loading) return <SkeletonList count={4} />;

  const filtered = needs.filter(n => {
    const matchesCategory = filter === 'all' || n.category === filter;
    const matchesSearch = !search.trim() ||
      n.area.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const sortedFiltered = [...filtered].sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a));

  if (needs.length === 0) {
    return (
      <div className="text-center py-24 fade-in">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📭</div>
        <h3 className="text-lg font-semibold text-gray-700">No needs reported yet</h3>
        <p className="text-gray-400 text-sm mt-1">Use the "Report Need" tab to add the first one</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by area or description..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">{sortedFiltered.length} of {needs.length} needs</span>
          {needs.filter(n => getEffectiveScore(n) >= 75).length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              {needs.filter(n => getEffectiveScore(n) >= 75).length} critical
            </span>
          )}
          {needs.filter(n => n.status === 'resolved').length > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              {needs.filter(n => n.status === 'resolved').length} resolved
            </span>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              filter === f
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600'
            }`}
          >
            {f === 'all' ? 'All' : `${CATEGORY_ICONS[f] ?? ''} ${formatCategory(f)}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No {formatCategory(filter)} needs found</p>
        </div>
      )}

      {/* Need cards */}
      {sortedFiltered.map((need, idx) => {
        const effectiveScore = getEffectiveScore(need);
        const effectiveBreakdown = getEffectiveBreakdown(need);
        return (
        <div
          key={need.needId}
          className="card p-5 fade-in"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">{CATEGORY_ICONS[need.category] ?? '📋'}</span>
                <h3 className="text-base font-bold text-gray-900">{need.area}</h3>
                <UrgencyBadge score={effectiveScore} />
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                  {formatCategory(need.category)}
                </span>
                <span className="capitalize font-medium text-gray-600">{need.severity} severity</span>
                <span>{need.reportedCount} reports</span>
                <span>{formatDate(need.createdAt)}</span>
              </div>

              <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">{need.description}</p>
            </div>
          </div>

          {/* Score breakdown toggle */}
          <button
            onClick={() => setExpanded(expanded === need.needId ? null : need.needId)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="transition-transform duration-200" style={{ display: 'inline-block', transform: expanded === need.needId ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            {expanded === need.needId ? 'Hide' : 'Show'} score breakdown
          </button>

          {expanded === need.needId && (
            <div className="mt-3 pt-3 border-t border-gray-100 slide-up">
              <ScoreBreakdown breakdown={effectiveBreakdown} />
            </div>
          )}

          {need.status === 'open' ? (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => navigate(`/coordinator/need/${need.needId}`)}
                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
              >
                View & Create Task
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => handleResolve(need.needId)}
                disabled={resolving === need.needId}
                className="px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-sm font-semibold rounded-xl transition-all duration-150 disabled:opacity-50"
                title="Mark as resolved"
              >
                {resolving === need.needId ? '...' : '✓ Resolve'}
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full inline-block ${need.status === 'resolved' ? 'bg-green-400' : 'bg-blue-400'}`} />
              <span className="text-xs text-gray-400 capitalize">{need.status.replace('_', ' ')}</span>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
