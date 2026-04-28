import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNeed, createTask } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { Need } from '../../types/need.types';
import { SKILLS } from '../../utils/constants';
import Navbar from '../../components/Layout/Navbar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import UrgencyBadge from '../../components/Dashboard/UrgencyBadge';
import toast from 'react-hot-toast';

export default function CreateTask() {
  const { needId } = useParams<{ needId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = useFirestore();

  const [need, setNeed] = useState<Need | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [volunteersNeeded, setVolunteersNeeded] = useState(2);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    if (!needId) return;
    getNeed(needId, db).then((n) => {
      if (n) {
        setNeed(n);
        setTitle(`Response: ${n.area}`);
        setDescription(n.description);
        setArea(n.area);
      }
      setLoading(false);
    });
  }, [needId]);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!need || !user || !scheduledDate) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      const date = new Date(scheduledDate);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      const taskId = await createTask({
        linkedNeedId: need.needId,
        title, description, area,
        lat: need.lat, lng: need.lng,
        requiredSkills: selectedSkills,
        volunteersNeeded,
        suggestedVolunteers: [],
        assignedVolunteers: [],
        confirmedVolunteers: [],
        status: 'open',
        scheduledDate,
        scheduledDay: dayName,
        createdBy: user.uid,
      }, db);

      toast.success('Task created! Finding volunteers...');
      navigate(`/coordinator/match/${taskId}`);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
    setSubmitting(false);
  }

  if (loading) return <><Navbar /><LoadingSpinner /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4 block">← Back</button>

        {need && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 flex items-center gap-2">
            <span>🔗</span>
            <span className="text-sm text-orange-700">
              Linked to: <strong>{need.area}</strong> &nbsp;
              <UrgencyBadge score={need.urgencyScore} showScore />
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Create Task</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input required value={area} onChange={(e) => setArea(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers Needed</label>
                <input type="number" min={1} value={volunteersNeeded} onChange={(e) => setVolunteersNeeded(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input required type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      selectedSkills.includes(skill)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:border-blue-400'
                    }`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create & Find Volunteers →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
