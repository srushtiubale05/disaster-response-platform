import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, acceptTask, declineTask } from '../../services/firestore';
import { Task } from '../../types/task.types';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import Navbar from '../../components/Layout/Navbar';
import TaskStatusChip from '../../components/Dashboard/TaskStatusChip';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = useFirestore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    getTask(taskId, db).then((t) => { setTask(t); setLoading(false); });
  }, [taskId, db]);

  async function handleAccept() {
    if (!task || !user) return;
    setActing(true);
    const err = await acceptTask(task.taskId, user.uid, db);
    setActing(false);
    if (err) { toast.error(err); return; }
    toast.success('Task accepted!');
    navigate('/volunteer');
  }

  async function handleDecline() {
    if (!task || !user) return;
    setActing(true);
    await declineTask(task.taskId, user.uid, db);
    setActing(false);
    toast.success('Task declined');
    navigate('/volunteer');
  }

  if (loading) return <><Navbar /><LoadingSpinner /></>;
  if (!task) return <><Navbar /><div className="p-8 text-center text-gray-500">Task not found</div></>;

  const isConfirmed = user ? task.confirmedVolunteers.includes(user.uid) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4 block">← Back</button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <TaskStatusChip status={task.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><p className="text-gray-400">Location</p><p className="font-medium">📍 {task.area}</p></div>
            <div><p className="text-gray-400">Schedule</p><p className="font-medium capitalize">📅 {task.scheduledDay}, {task.scheduledDate}</p></div>
            <div><p className="text-gray-400">Volunteers</p><p className="font-medium">👥 {task.confirmedVolunteers.length}/{task.volunteersNeeded} confirmed</p></div>
          </div>

          <p className="text-gray-700 mb-4">{task.description}</p>

          {task.requiredSkills.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {task.requiredSkills.map((s) => (
                  <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {isConfirmed ? (
            <button
              onClick={() => navigate(`/volunteer/task/${task.taskId}/progress`)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition"
            >
              Update Progress →
            </button>
          ) : task.status === 'open' || task.status === 'assigned' ? (
            <div className="flex gap-3">
              <button onClick={handleAccept} disabled={acting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
                ✓ Accept Task
              </button>
              <button onClick={handleDecline} disabled={acting}
                className="flex-1 border border-red-400 text-red-600 hover:bg-red-50 font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
                ✗ Decline
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
