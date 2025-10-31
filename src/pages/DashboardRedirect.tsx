import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardRedirect() {
  const { currentShop, loading } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for shop to load
    if (!loading && currentShop) {
      navigate(`/dashboard/${currentShop.id}`, { replace: true });
    } else if (!loading && !currentShop && user) {
      // User is logged in but has no shop - redirect to signup or show error
      navigate('/signup', { replace: true });
    }
  }, [currentShop, loading, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentShop) {
    return <Navigate to={`/dashboard/${currentShop.id}`} replace />;
  }

  // No shop found - redirect to signup
  return <Navigate to="/signup" replace />;
}

