import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  onClick?: () => void;
}

export default function BackButton({ to, label = 'Back', onClick }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  // Don't show back button on home page
  const isHomePage = location.pathname.match(/^\/dashboard\/[^\/]+$/);
  if (isHomePage) return null;

  return (
    <button
      onClick={handleClick}
      className="ios-back-button"
      style={{
        background: 'none',
        border: 'none',
        padding: '0.5rem',
        cursor: 'pointer',
        color: '#007aff',
        fontSize: '1rem',
        fontWeight: 400,
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        marginBottom: '0.5rem',
      }}
    >
      <ChevronLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

