import { useNeeds } from '../../hooks/useNeeds';
import { useTasks } from '../../hooks/useTasks';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

export default function Analytics() {
  const { needs, loading: needsLoading } = useNeeds();
  const { tasks, loading: tasksLoading } = useTasks();

  if (needsLoading || tasksLoading) return <LoadingSpinner text="Loading analytics..." />;

  // ── Compute stats ──────────────────────────────────────────────────────────
  const totalNeeds = needs.length;
  const openNeeds = needs.filter((n) => n.status === 'open').length;
  const resolvedNeeds = needs.filter((n) => n.status === 'resolved').length;
  const avgUrgency = totalNeeds > 0
    ? needs.reduce((s, n) => s + n.urgencyScore, 0) / totalNeeds
    : 0;
  const criticalNeeds = needs.filter((n) => n.urgencyScore >= 80).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const totalVolunteersAssigned = tasks.reduce((s, t) => s + t.assignedVolunteers.length, 0);
  const totalVolunteersConfirmed = tasks.reduce((s, t) => s + t.confirmedVolunteers.length, 0);
  const acceptanceRate = totalVolunteersAssigned > 0
    ? (totalVolunteersConfirmed / totalVolunteersAssigned) * 100
    : 0;

  // Category breakdown
  const categoryCount: Record<string, number> = {};
  needs.forEach((n) => {
    categoryCount[n.category] = (categoryCount[n.category] ?? 0) + 1;
  });
  const categoryEntries = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

  // Severity breakdown
  const severityCount: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  needs.forEach((n) => { severityCount[n.severity] = (severityCount[n.severity] ?? 0) + 1; });

  // Task status breakdown
  const statusCount: Record<string, number> = {};
  tasks.forEach((t) => { statusCount[t.status] = (statusCount[t.status] ?? 0) + 1; });

  const statCards = [
    { label: 'Total Needs', value: totalNeeds, icon: '⚠️', color: 'bg-red-50 border-red-200' },
    { label: 'Open Needs', value: openNeeds, icon: '🔴', color: 'bg-orange-50 border-orange-200' },
    { label: 'Critical (≥80)', value: criticalNeeds, icon: '🚨', color: 'bg-red-50 border-red-200' },
    { label: 'Avg Urgency', value: `${avgUrgency.toFixed(1)}/100`, icon: '📊', color: 'bg-blue-50 border-blue-200' },
    { label: 'Total Tasks', value: totalTasks, icon: '📋', color: 'bg-purple-50 border-purple-200' },
    { label: 'Completed', value: completedTasks, icon: '✅', color: 'bg-green-50 border-green-200' },
    { label: 'Completion Rate', value: `${completionRate.toFixed(0)}%`, icon: '📈', color: 'bg-green-50 border-green-200' },
    { label: 'Volunteer Accept Rate', value: `${acceptanceRate.toFixed(0)}%`, icon: '🙋', color: 'bg-blue-50 border-blue-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Needs by Category</h3>
          {categoryEntries.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {categoryEntries.map(([cat, count]) => {
                const pct = totalNeeds > 0 ? (count / totalNeeds) * 100 : 0;
                const label = cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-800">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Severity breakdown */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Needs by Severity</h3>
          <div className="space-y-3">
            {[
              { key: 'critical', label: 'Critical', color: 'bg-red-500' },
              { key: 'high', label: 'High', color: 'bg-orange-500' },
              { key: 'medium', label: 'Medium', color: 'bg-yellow-500' },
              { key: 'low', label: 'Low', color: 'bg-green-500' },
            ].map(({ key, label, color }) => {
              const count = severityCount[key] ?? 0;
              const pct = totalNeeds > 0 ? (count / totalNeeds) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{count}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task status breakdown */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Task Status Overview</h3>
          {totalTasks === 0 ? (
            <p className="text-sm text-gray-400">No tasks yet</p>
          ) : (
            <div className="space-y-3">
              {[
                { key: 'open', label: 'Open', color: 'bg-gray-400' },
                { key: 'assigned', label: 'Assigned', color: 'bg-blue-500' },
                { key: 'in_progress', label: 'In Progress', color: 'bg-orange-500' },
                { key: 'completed', label: 'Completed', color: 'bg-green-500' },
              ].map(({ key, label, color }) => {
                const count = statusCount[key] ?? 0;
                const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-800">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full transition-all`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Volunteer engagement */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Volunteer Engagement</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Assigned</span>
              <span className="text-xl font-bold text-gray-900">{totalVolunteersAssigned}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confirmed</span>
              <span className="text-xl font-bold text-green-600">{totalVolunteersConfirmed}</span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Acceptance Rate</span>
                <span className="font-bold text-blue-600">{acceptanceRate.toFixed(0)}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${acceptanceRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Task Completion Rate</span>
                <span className="font-bold text-green-600">{completionRate.toFixed(0)}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top urgent needs */}
      {needs.filter((n) => n.urgencyScore >= 60).length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">🚨 High Priority Needs (Score ≥ 60)</h3>
          <div className="space-y-2">
            {needs
              .filter((n) => n.urgencyScore >= 60)
              .sort((a, b) => b.urgencyScore - a.urgencyScore)
              .slice(0, 5)
              .map((n) => (
                <div key={n.needId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{n.area}</p>
                    <p className="text-xs text-gray-500 capitalize">{n.category.replace(/_/g, ' ')} · {n.severity}</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                    n.urgencyScore >= 80 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {n.urgencyScore.toFixed(0)}/100
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
