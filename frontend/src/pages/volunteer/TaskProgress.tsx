import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTaskStatus, recalculateReliability } from '../../services/firestore';
import { Task } from '../../types/task.types';
import { useFirestore } from '../../hooks/useFirestore';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Layout/Navbar';
import TaskStatusChip from '../../components/Dashboard/TaskStatusChip';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function TaskProgress() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const db = useFirestore();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    getTask(taskId, db).then((t) => { setTask(t); setLoading(false); });
  }, [taskId, db]);

  async function updateStatus(status: string) {
    if (!task) return;
    setUpdating(true);
    await updateTaskStatus(task.taskId, status, db);

    if (status === 'completed') {
      // Always update the current user's reliability — don't depend on confirmedVolunteers array
      if (user?.uid) {
        await recalculateReliability(user.uid, db);
      }
      toast.success('Task completed! Reliability score updated.');
      navigate('/volunteer');
    } else {
      toast.success('Status updated');
      setTask({ ...task, status: status as Task['status'] });
    }
    setUpdating(false);
  }

  if (loading) return <><Navbar /><LoadingSpinner /></>;
  if (!task) return <><Navbar /><div className="p-8 text-center text-gray-500">Task not found</div></>;

  const stepIndex = STEPS.findIndex((s) => s.key === task.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4 block">← Back</button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <TaskStatusChip status={task.status} />
          </div>

          {/* Progress stepper */}
          <div className="flex items-center mb-8">
            {STEPS.map((step, i) => {
              const done = i <= stepIndex;
              const active = i === stepIndex;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  } ${active ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}>
                    {done && i < stepIndex ? '✓' : i + 1}
                  </div>
                  <div className="ml-2 mr-4">
                    <p className={`text-xs font-medium ${active ? 'text-green-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mr-4 ${i < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {(task.status === 'assigned' || task.status === 'open') && (
              <button onClick={() => updateStatus('in_progress')} disabled={updating}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
                ▶ Mark In Progress
              </button>
            )}
            {task.status === 'in_progress' && (
              <button onClick={() => updateStatus('completed')} disabled={updating}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
                ✓ Mark Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
