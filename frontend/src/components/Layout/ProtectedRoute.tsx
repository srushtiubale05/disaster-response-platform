import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../Common/LoadingSpinner';
import { UserRole } from '../../types/user.types';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  role: UserRole;
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, role: userRole, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (userRole !== role) return <Navigate to={`/${userRole}`} replace />;

  return <>{children}</>;
}
