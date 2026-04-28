import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ErrorBoundary from './components/Common/ErrorBoundary';
import SessionBar from './components/Layout/SessionBar';
import GeminiChat from './components/Chat/GeminiChat';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { AuthProvider } from './contexts/AuthContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import TaskDetail from './pages/volunteer/TaskDetail';
import TaskProgress from './pages/volunteer/TaskProgress';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import NeedDetail from './pages/coordinator/NeedDetail';
import CreateTask from './pages/coordinator/CreateTask';
import MatchVolunteers from './pages/coordinator/MatchVolunteers';

// Routes rendered inside the active session's AuthProvider
function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Initializing..." />;

  return (
    <>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : role ? <Navigate to={`/${role}`} replace /> : <LoadingSpinner />} />
        <Route path="/register" element={!user ? <Register /> : role ? <Navigate to={`/${role}`} replace /> : <LoadingSpinner />} />

        <Route path="/volunteer" element={<ProtectedRoute role="volunteer"><VolunteerDashboard /></ProtectedRoute>} />
        <Route path="/volunteer/task/:taskId" element={<ProtectedRoute role="volunteer"><TaskDetail /></ProtectedRoute>} />
        <Route path="/volunteer/task/:taskId/progress" element={<ProtectedRoute role="volunteer"><TaskProgress /></ProtectedRoute>} />

        <Route path="/coordinator" element={<ProtectedRoute role="coordinator"><CoordinatorDashboard /></ProtectedRoute>} />
        <Route path="/coordinator/need/:needId" element={<ProtectedRoute role="coordinator"><NeedDetail /></ProtectedRoute>} />
        <Route path="/coordinator/create-task/:needId" element={<ProtectedRoute role="coordinator"><CreateTask /></ProtectedRoute>} />
        <Route path="/coordinator/match/:taskId" element={<ProtectedRoute role="coordinator"><MatchVolunteers /></ProtectedRoute>} />

        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> :
          role === 'coordinator' ? <Navigate to="/coordinator" replace /> :
          role === 'volunteer' ? <Navigate to="/volunteer" replace /> :
          <LoadingSpinner text="Loading profile..." />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Gemini chat — only shown when logged in */}
      {user && <GeminiChat />}
    </>
  );
}

// Wraps AppRoutes with the active session's AuthProvider
function ActiveSessionView() {
  const { activeSession } = useSession();

  if (!activeSession) return <LoadingSpinner />;

  return (
    // Key on session ID only — prevents AuthProvider from remounting when
    // session metadata (user, role, label) updates after sign-in/sign-out
    <AuthProvider key={activeSession.id} firebaseApp={activeSession.app}>
      <AppRoutes />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <BrowserRouter>
          {/* Session switcher bar — always visible at top */}
          <SessionBar />
          <ActiveSessionView />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </BrowserRouter>
      </SessionProvider>
    </ErrorBoundary>
  );
}
