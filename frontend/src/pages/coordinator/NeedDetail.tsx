import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNeed } from '../../services/firestore';
import { Need } from '../../types/need.types';
import UrgencyBadge from '../../components/Dashboard/UrgencyBadge';
import ScoreBreakdown from '../../components/Dashboard/ScoreBreakdown';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Navbar from '../../components/Layout/Navbar';
import { formatDate, formatCategory } from '../../utils/formatters';
import { useFirestore } from '../../hooks/useFirestore';

export default function NeedDetail() {
  const { needId } = useParams<{ needId: string }>();
  const navigate = useNavigate();
  const db = useFirestore();
  const [need, setNeed] = useState<Need | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!needId) return;
    getNeed(needId, db).then((n) => { setNeed(n); setLoading(false); });
  }, [needId, db]);

  if (loading) return <><Navbar /><LoadingSpinner /></>;
  if (!need) return <><Navbar /><div className="p-8 text-center text-gray-500">Need not found</div></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4 block">
          ← Back
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{need.area}</h1>
            <UrgencyBadge score={need.urgencyScore} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
            <div><p className="text-gray-400">Category</p><p className="font-medium">{formatCategory(need.category)}</p></div>
            <div><p className="text-gray-400">Severity</p><p className="font-medium capitalize">{need.severity}</p></div>
            <div><p className="text-gray-400">Reports</p><p className="font-medium">{need.reportedCount}</p></div>
            <div><p className="text-gray-400">Reported</p><p className="font-medium">{formatDate(need.createdAt)}</p></div>
          </div>

          <p className="text-gray-700 mb-6">{need.description}</p>

          <div className="border-t pt-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Urgency Score: {need.urgencyScore.toFixed(1)} / 100</h2>
            <ScoreBreakdown breakdown={need.scoreBreakdown} />
          </div>

          {need.status === 'open' && (
            <button
              onClick={() => navigate(`/coordinator/create-task/${need.needId}`)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Create Task from this Need →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
