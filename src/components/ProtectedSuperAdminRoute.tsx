import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedSuperAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedSuperAdminRoute({ children }: ProtectedSuperAdminRouteProps) {
  const { user } = useAuth();

  // Check if user has super admin role
  // Super admin access is granted to:
  // 1. Emails ending with @digiget.uk (e.g., robin@digiget.uk)
  // 2. Users with role='super' in user_metadata
  // 3. Users with is_super_admin=true in user_metadata
  const isSuperAdmin = user?.email?.endsWith('@digiget.uk') || 
                       (user?.user_metadata?.role === 'super') ||
                       (user?.user_metadata?.is_super_admin === true);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    console.warn('Super admin access denied for:', user.email);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

