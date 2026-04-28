import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../contexts/SessionContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, role } = useAuth();
  const { activeSessionId, logoutSession } = useSession();

  async function handleSignOut() {
    await logoutSession(activeSessionId);
    toast.success('Signed out');
    window.location.href = '/login';
  }

  const roleConfig: Record<string, { label: string; color: string }> = {
    coordinator: { label: 'Coordinator', color: 'bg-orange-500/20 text-orange-200 border border-orange-500/30' },
    volunteer:   { label: 'Volunteer',   color: 'bg-green-500/20 text-green-200 border border-green-500/30' },
    admin:       { label: 'Admin',       color: 'bg-blue-500/20 text-blue-200 border border-blue-500/30' },
  };
  const rc = role ? roleConfig[role] : null;

  return (
    <nav className="bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-xl">
            🚨
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">DisasterResponse</span>
            {rc && (
              <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${rc.color}`}>
                {rc.label}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-red-100 max-w-[160px] truncate">{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl text-sm font-medium transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
