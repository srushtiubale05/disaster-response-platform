import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopMatches, assignVolunteers } from '../../services/api';
import { MatchedVolunteer } from '../../types/volunteer.types';
import VolunteerCard from '../../components/Dashboard/VolunteerCard';
import Navbar from '../../components/Layout/Navbar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useFirestore } from '../../hooks/useFirestore';

export default function MatchVolunteers() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const db = useFirestore();
  const [matches, setMatches] = useState<MatchedVolunteer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    loadMatches();
  }, [taskId]);

  async function loadMatches() {
    setLoading(true);
    setError(null);
    try {
      const top = await getTopMatches(taskId!, db);
      setMatches(top);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
    setLoading(false);
  }

  function toggleSelect(uid: string) {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  async function handleAssign() {
    if (selected.length === 0) { toast.error('Select at least one volunteer'); return; }
    setAssigning(true);
    try {
      await assignVolunteers(taskId!, selected, db);
      toast.success(`${selected.length} volunteer(s) assigned! Notifications sent.`);
      navigate('/coordinator');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
    setAssigning(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4 block">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Volunteer Matching</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ranked by skill match · proximity · reliability · availability
        </p>

        {loading && <LoadingSpinner text="Running AI matching algorithm..." />}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={loadMatches} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p>No available volunteers found</p>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {matches.map((v, i) => (
                <VolunteerCard
                  key={v.uid}
                  volunteer={v}
                  rank={i + 1}
                  selected={selected.includes(v.uid)}
                  onSelect={toggleSelect}
                />
              ))}
            </div>

            <button
              onClick={handleAssign}
              disabled={selected.length === 0 || assigning}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-40"
            >
              {assigning ? 'Assigning...' : `Assign Selected (${selected.length} volunteer${selected.length !== 1 ? 's' : ''})`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
