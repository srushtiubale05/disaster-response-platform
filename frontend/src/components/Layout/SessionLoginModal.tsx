import { useState, FormEvent } from 'react';
import { useSession } from '../../contexts/SessionContext';
import toast from 'react-hot-toast';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export default function SessionLoginModal({ sessionId, onClose }: Props) {
  const { loginSession, sessions } = useSession();
  const session = sessions.find((s) => s.id === sessionId);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const err = await loginSession(sessionId, email, password);
    setLoading(false);
    if (err) {
      toast.error(err);
    } else {
      toast.success(`Logged in as ${email}`);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Login — {session?.label ?? sessionId}
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          This session runs independently in the same browser tab.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 text-sm py-1"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
