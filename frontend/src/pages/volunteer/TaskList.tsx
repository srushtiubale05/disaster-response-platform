import { useNavigate } from 'react-router-dom';
import { useVolunteerTasks } from '../../hooks/useTasks';
import TaskStatusChip from '../../components/Dashboard/TaskStatusChip';
import { SkeletonList } from '../../components/Common/LoadingSpinner';

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0, assigned: 1, open: 2, completed: 3,
};

export default function TaskList({ uid }: { uid: string }) {
  const { tasks, loading } = useVolunteerTasks(uid);
  const navigate = useNavigate();

  if (loading) return <SkeletonList count={3} />;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-24 fade-in">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📭</div>
        <h3 className="text-lg font-semibold text-gray-700">No tasks yet</h3>
        <p className="text-gray-400 text-sm mt-1">You'll be notified when a coordinator assigns you a task</p>
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) =>
    (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  const active = sorted.filter(t => t.status !== 'completed');
  const done   = sorted.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6 fade-in">
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active ({active.length})</p>
          {active.map((task, idx) => (
            <TaskCard key={task.taskId} task={task} idx={idx} onClick={() => navigate(`/volunteer/task/${task.taskId}`)} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed ({done.length})</p>
          {done.map((task, idx) => (
            <TaskCard key={task.taskId} task={task} idx={idx} onClick={() => navigate(`/volunteer/task/${task.taskId}`)} dimmed />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, idx, onClick, dimmed = false }: { task: any; idx: number; onClick: () => void; dimmed?: boolean }) {
  const isUrgent = task.status === 'in_progress';

  return (
    <div
      onClick={onClick}
      className={`card p-4 cursor-pointer fade-in ${dimmed ? 'opacity-60' : ''} ${
        isUrgent ? 'border-l-4 border-l-orange-500' : ''
      }`}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
            {isUrgent && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full animate-pulse">
                ACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>📍 {task.area}</span>
            <span>📅 {task.scheduledDate}</span>
          </div>
        </div>
        <TaskStatusChip status={task.status} />
      </div>

      {task.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {task.requiredSkills.map((s: string) => (
            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400 capitalize">
          {task.confirmedVolunteers?.length ?? 0}/{task.volunteersNeeded} confirmed
        </span>
        <span className="text-xs text-blue-600 font-medium">View details →</span>
      </div>
    </div>
  );
}
