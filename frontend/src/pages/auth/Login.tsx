import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { usePublicStats } from '../../hooks/usePublicStats';
import toast from 'react-hot-toast';

function AnimatedNumber({ value, loading }: { value: number; loading: boolean }) {
  if (loading) return <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse" />;
  return <span>{value.toLocaleString()}</span>;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { activeSessionId, loginSession } = useSession();
  const stats = usePublicStats();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const error = await loginSession(activeSessionId, email, password);
    if (error) toast.error(error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-lg shadow-red-200 mb-4">
            <span className="text-3xl">🚨</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">Disaster Response</h1>
          <p className="text-gray-500 mt-1.5">Volunteer Coordination Platform</p>
        </div>

        {/* Live Impact Counter */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 mb-6 text-white">
          <p className="text-xs text-red-200 font-semibold uppercase tracking-wider text-center mb-3">
            🔴 Live Impact — India
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Needs', value: stats.totalNeeds, icon: '⚠️' },
              { label: 'Resolved', value: stats.resolvedNeeds, icon: '✅' },
              { label: 'Volunteers', value: stats.totalVolunteers, icon: '🙋' },
              { label: 'Tasks Done', value: stats.completedTasks, icon: '📋' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/10 rounded-xl py-2 px-1">
                <div className="text-lg">{icon}</div>
                <div className="text-xl font-black">
                  <AnimatedNumber value={value} loading={stats.loading} />
                </div>
                <div className="text-xs text-red-200">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-red-600 hover:text-red-700 font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Google Solutions Challenge 2026 · Smart Resource Allocation
          </p>
        </div>
      </div>
    </div>
  );
}
