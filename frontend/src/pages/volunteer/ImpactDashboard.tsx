import { useVolunteer } from '../../hooks/useVolunteers';
import { useVolunteerTasks } from '../../hooks/useTasks';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import TaskStatusChip from '../../components/Dashboard/TaskStatusChip';
import { formatDate } from '../../utils/formatters';

interface Props { uid: string }

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_task', icon: '🌱', label: 'First Step', desc: 'Completed your first task', req: (c: number) => c >= 1 },
  { id: 'five_tasks', icon: '⭐', label: 'Rising Star', desc: 'Completed 5 tasks', req: (c: number) => c >= 5 },
  { id: 'ten_tasks', icon: '🏆', label: 'Champion', desc: 'Completed 10 tasks', req: (c: number) => c >= 10 },
  { id: 'twenty_tasks', icon: '🦸', label: 'Hero', desc: 'Completed 20 tasks', req: (c: number) => c >= 20 },
  { id: 'reliable', icon: '💎', label: 'Reliable', desc: '90%+ reliability score', req: (_: number, r: number) => r >= 90 },
  { id: 'perfect', icon: '🎯', label: 'Perfect Record', desc: '100% reliability', req: (_: number, r: number) => r === 100 },
];

export default function ImpactDashboard({ uid }: Props) {
  const { volunteer, loading: volLoading } = useVolunteer(uid);
  const { tasks, loading: tasksLoading } = useVolunteerTasks(uid);

  if (volLoading || tasksLoading) return <LoadingSpinner text="Loading your impact..." />;
  if (!volunteer) return <div className="text-center text-gray-400 py-12">Profile not found</div>;

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = tasks.filter((t) => t.status === 'open' || t.status === 'assigned');

  // Unique areas served
  const areasServed = [...new Set(completedTasks.map((t) => t.area))];

  // Skills used across completed tasks
  const skillsUsed = [...new Set(completedTasks.flatMap((t) => t.requiredSkills))];

  // Estimated hours (2h per task as proxy)
  const estimatedHours = completedTasks.length * 2;

  // Unlocked achievements
  const unlockedAchievements = ACHIEVEMENTS.filter((a) =>
    a.req(volunteer.tasksCompleted, volunteer.reliabilityScore)
  );

  // Reliability ring color
  const reliabilityColor =
    volunteer.reliabilityScore >= 90 ? 'text-green-600' :
    volunteer.reliabilityScore >= 70 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Hero impact card */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-black">
            {volunteer.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{volunteer.name}</h2>
            <p className="text-red-200 text-sm">{volunteer.email}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              volunteer.isAvailable ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-200'
            }`}>
              {volunteer.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-3xl font-black">{volunteer.tasksCompleted}</div>
            <div className="text-xs text-red-200 mt-0.5">Tasks Done</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-3xl font-black">{estimatedHours}h</div>
            <div className="text-xs text-red-200 mt-0.5">Hours Given</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className={`text-3xl font-black`}>{volunteer.reliabilityScore.toFixed(0)}%</div>
            <div className="text-xs text-red-200 mt-0.5">Reliability</div>
          </div>
        </div>
      </div>

      {/* Reliability meter */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Reliability Score</h3>
          <span className={`text-2xl font-black ${reliabilityColor}`}>
            {volunteer.reliabilityScore.toFixed(0)}%
          </span>
        </div>
        <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-700 ${
              volunteer.reliabilityScore >= 90 ? 'bg-green-500' :
              volunteer.reliabilityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${volunteer.reliabilityScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>Completed: {volunteer.tasksCompleted} · Declined: {volunteer.tasksDeclined}</span>
          <span>100%</span>
        </div>
      </div>

      {/* Impact stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-2xl mb-1">🗺️</div>
          <div className="text-2xl font-black text-gray-900">{areasServed.length}</div>
          <div className="text-xs text-gray-500">Communities Served</div>
          {areasServed.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {areasServed.slice(0, 3).map((a) => (
                <span key={a} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded truncate max-w-[100px]">{a}</span>
              ))}
              {areasServed.length > 3 && <span className="text-xs text-gray-400">+{areasServed.length - 3}</span>}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-2xl mb-1">🔧</div>
          <div className="text-2xl font-black text-gray-900">{skillsUsed.length}</div>
          <div className="text-xs text-gray-500">Skills Applied</div>
          {skillsUsed.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {skillsUsed.slice(0, 3).map((s) => (
                <span key={s} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{s}</span>
              ))}
              {skillsUsed.length > 3 && <span className="text-xs text-gray-400">+{skillsUsed.length - 3}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-3">
          Achievements
          <span className="ml-2 text-xs text-gray-400">{unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked</span>
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = a.req(volunteer.tasksCompleted, volunteer.reliabilityScore);
            return (
              <div key={a.id} className={`rounded-xl p-3 text-center transition ${
                unlocked ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-100 opacity-40'
              }`}>
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-xs font-semibold text-gray-700">{a.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task history */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-3">
          Task History
          <span className="ml-2 text-xs text-gray-400">{tasks.length} total</span>
        </h3>

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No tasks yet — accept your first task to start building your record!</p>
        ) : (
          <div className="space-y-2">
            {/* Active first */}
            {[...inProgressTasks, ...pendingTasks, ...completedTasks].map((task) => (
              <div key={task.taskId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">📍 {task.area} · 📅 {task.scheduledDate}</p>
                </div>
                <TaskStatusChip status={task.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills & availability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-3">My Skills</h3>
          <div className="flex flex-wrap gap-2">
            {volunteer.skills.map((s) => (
              <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{s}</span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Availability</h3>
          <div className="flex flex-wrap gap-2">
            {volunteer.availability.map((d) => (
              <span key={d} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full capitalize">{d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
