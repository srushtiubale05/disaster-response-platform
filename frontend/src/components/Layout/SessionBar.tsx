/**
 * SessionBar — persistent top bar showing all open sessions.
 * Lets users add new sessions, switch between them, and close them.
 * Each session is a fully independent Firebase Auth context.
 */
import { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import SessionLoginModal from './SessionLoginModal';

export default function SessionBar() {
  const { sessions, activeSessionId, createSession, switchSession, removeSession } =
    useSession();
  const [showLogin, setShowLogin] = useState<string | null>(null); // sessionId to login

  function handleAdd() {
    const id = createSession();
    setShowLogin(id); // immediately prompt login for new session
  }

  return (
    <>
      <div className="bg-gray-900 text-white text-xs flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
        <span className="text-gray-400 mr-2 shrink-0">Sessions:</span>

        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => switchSession(session.id)}
            >
              {/* Status dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  session.user ? 'bg-green-400' : 'bg-gray-500'
                }`}
              />
              <span className="max-w-[140px] truncate">
                {session.user ? session.label : `${session.label} (not logged in)`}
              </span>

              {/* Login button if not logged in */}
              {!session.user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLogin(session.id);
                  }}
                  className="ml-1 text-blue-300 hover:text-blue-100 font-medium"
                >
                  Login
                </button>
              )}

              {/* Close button — only show if more than 1 session */}
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(session.id);
                  }}
                  className="ml-1 text-gray-400 hover:text-red-400 font-bold leading-none"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* Add session button */}
        <button
          onClick={handleAdd}
          className="ml-2 px-2.5 py-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition shrink-0"
        >
          + Add Session
        </button>
      </div>

      {/* Login modal for a specific session */}
      {showLogin && (
        <SessionLoginModal
          sessionId={showLogin}
          onClose={() => setShowLogin(null)}
        />
      )}
    </>
  );
}
