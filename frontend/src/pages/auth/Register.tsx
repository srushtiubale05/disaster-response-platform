import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerVolunteer, registerCoordinator } from '../../services/auth';
import { SKILLS, DAYS } from '../../utils/constants';
import toast from 'react-hot-toast';
import { useSession } from '../../contexts/SessionContext';

type Role = 'volunteer' | 'coordinator';

export default function Register() {
  const [role, setRole] = useState<Role>('volunteer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeSessionId, loginSession } = useSession();

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (role === 'volunteer' && selectedSkills.length === 0) {
      toast.error('Select at least one skill');
      return;
    }
    setLoading(true);
    try {
      if (role === 'volunteer') {
        await registerVolunteer({ email, password, name, phone, skills: selectedSkills, availability: selectedDays, address });
      } else {
        await registerCoordinator({ email, password, name });
      }
      toast.success('Account created! Signing you in...');
      const error = await loginSession(activeSessionId, email, password);
      if (error) toast.error(error);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-2xl shadow-lg shadow-red-200 mb-3">
            <span className="text-2xl">🚨</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the disaster response network</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          {/* Role toggle */}
          <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
            {(['volunteer', 'coordinator'] as Role[]).map((r) => (
              <button
                key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  role === r
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === 'volunteer' ? '🙋 Volunteer' : '🎯 Coordinator'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Full Name" value={name}
              onChange={(e) => setName(e.target.value)} className="input" />
            <input required type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)} className="input" />
            <input required type="password" placeholder="Password (min 6 chars)" value={password}
              onChange={(e) => setPassword(e.target.value)} className="input" />

            {role === 'volunteer' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Phone number" value={phone}
                    onChange={(e) => setPhone(e.target.value)} className="input" />
                  <input placeholder="Area / Address" value={address}
                    onChange={(e) => setAddress(e.target.value)} className="input" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Skills
                    {selectedSkills.length > 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">{selectedSkills.length} selected</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                          selectedSkills.includes(skill)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 bg-white'
                        }`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Availability
                    {selectedDays.length > 0 && (
                      <span className="ml-2 text-xs text-green-600 font-normal">{selectedDays.length} days</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button key={day} type="button" onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition-all duration-150 ${
                          selectedDays.includes(day)
                            ? 'bg-green-600 text-white border-green-600 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600 bg-white'
                        }`}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : `Create ${role === 'volunteer' ? 'Volunteer' : 'Coordinator'} Account →`}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
