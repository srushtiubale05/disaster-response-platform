import { useState, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useFirestore } from '../../hooks/useFirestore';
import TaskStatusChip from '../../components/Dashboard/TaskStatusChip';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import { Task } from '../../types/task.types';
import { getVolunteer } from '../../services/firestore';
import { Volunteer } from '../../types/volunteer.types';

// ── Task Detail Modal ─────────────────────────────────────────────────────────
function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loadingVols, setLoadingVols] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    const uids = Array.from(
      new Set([...task.assignedVolunteers, ...task.confirmedVolunteers])
    );
    if (uids.length === 0) return;
    setLoadingVols(true);
    Promise.all(uids.map((uid) => getVolunteer(uid, db))).then((results) => {
      setVolunteers(results.filter(Boolean) as Volunteer[]);
      setLoadingVols(false);
    });
  }, [task.taskId, db]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            <p className="text-sm text-gray-500 mt-1">📍 {task.area}</p>
          </div>
          <div className="flex items-center gap-3">
            <TaskStatusChip status={task.status} />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Schedule</p>
              <p className="font-medium capitalize mt-0.5">
                {task.scheduledDay}, {task.scheduledDate}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Volunteers</p>
              <p className="font-medium mt-0.5">
                {task.confirmedVolunteers.length}/{task.volunteersNeeded} confirmed
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Created</p>
              <p className="font-medium mt-0.5">{formatDate(task.createdAt)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Description</p>
            <p className="text-gray-700 text-sm">{task.description}</p>
          </div>

          {/* Required skills */}
          {task.requiredSkills.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {task.requiredSkills.map((s) => (
                  <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned volunteers */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">
              Assigned Volunteers ({task.assignedVolunteers.length})
            </p>

            {task.assignedVolunteers.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No volunteers assigned yet</p>
            ) : loadingVols ? (
              <div className="flex gap-2 items-center text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Loading volunteer details...
              </div>
            ) : (
              <div className="space-y-3">
                {task.assignedVolunteers.map((uid) => {
                  const vol = volunteers.find((v) => v.uid === uid);
                  const isConfirmed = task.confirmedVolunteers.includes(uid);

                  return (
                    <div
                      key={uid}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isConfirmed
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                          isConfirmed ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        {vol ? vol.name[0].toUpperCase() : '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-gray-900">
                            {vol?.name ?? uid}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isConfirmed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {isConfirmed ? '✓ Confirmed' : '⏳ Pending'}
                          </span>
                        </div>
                        {vol && (
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                            <span>📧 {vol.email}</span>
                            {vol.phone && <span>📞 {vol.phone}</span>}
                            <span>⭐ {vol.reliabilityScore}% reliability</span>
                            <span>✅ {vol.tasksCompleted} completed</span>
                          </div>
                        )}
                        {vol && vol.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {vol.skills.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suggested volunteers (from AI matching) */}
          {task.suggestedVolunteers.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                AI Match Suggestions
              </p>
              <div className="space-y-2">
                {task.suggestedVolunteers.map((sv, i) => (
                  <div
                    key={sv.uid}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-gray-500 font-mono text-xs mr-2">#{i + 1}</span>
                    <span className="flex-1 font-medium text-gray-800">{sv.name}</span>
                    <span className="text-blue-600 font-bold">{sv.matchScore.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ActiveTasks list ──────────────────────────────────────────────────────────
export default function ActiveTasks() {
  const { tasks, loading } = useTasks();
  const [selected, setSelected] = useState<Task | null>(null);

  if (loading) return <LoadingSpinner />;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>No tasks yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.taskId}
            onClick={() => setSelected(task)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  📍 {task.area} · 📅 {task.scheduledDate}
                </p>
              </div>
              <TaskStatusChip status={task.status} />
            </div>

            {/* Volunteer avatars preview */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {task.assignedVolunteers.slice(0, 4).map((uid, i) => (
                  <div
                    key={uid}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white -ml-1 first:ml-0 ${
                      task.confirmedVolunteers.includes(uid) ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    style={{ zIndex: 10 - i }}
                    title={uid}
                  >
                    {uid.slice(-1).toUpperCase()}
                  </div>
                ))}
                {task.assignedVolunteers.length > 4 && (
                  <span className="text-xs text-gray-400 ml-1">
                    +{task.assignedVolunteers.length - 4} more
                  </span>
                )}
                {task.assignedVolunteers.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No volunteers assigned</span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {task.confirmedVolunteers.length}/{task.volunteersNeeded} confirmed · Click to view →
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <TaskDetailModal task={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
