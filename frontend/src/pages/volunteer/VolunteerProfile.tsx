import { useVolunteer } from '../../hooks/useVolunteers';
import { updateVolunteerAvailability } from '../../services/firestore';
import { useFirestore } from '../../hooks/useFirestore';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function VolunteerProfile({ uid }: { uid: string }) {
  const { volunteer, loading } = useVolunteer(uid);
  const db = useFirestore();

  if (loading) return <LoadingSpinner />;
  if (!volunteer) return <div className="text-center text-gray-400 py-12">Profile not found</div>;

  async function toggleAvailability() {
    if (!volunteer) return;
    await updateVolunteerAvailability(uid, !volunteer.isAvailable, db);
    toast.success(`You are now ${!volunteer.isAvailable ? 'available' : 'unavailable'}`);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
          {volunteer.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{volunteer.name}</h2>
          <p className="text-gray-500 text-sm">{volunteer.email}</p>
        </div>
        <button onClick={toggleAvailability}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            volunteer.isAvailable
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          {volunteer.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Reliability', value: `${volunteer.reliabilityScore.toFixed(0)}%` },
          { label: 'Completed', value: volunteer.tasksCompleted },
          { label: 'Declined', value: volunteer.tasksDeclined },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {volunteer.skills.map((s) => (
            <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{s}</span>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Availability</h3>
        <div className="flex flex-wrap gap-2">
          {volunteer.availability.map((d) => (
            <span key={d} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full capitalize">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
