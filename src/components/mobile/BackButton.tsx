import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  onClick?: () => void;
}

export default function BackButton({ to, label = 'Back', onClick }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="md:hidden flex items-center gap-2 text-[#2F80ED] font-medium py-2 px-1 active:opacity-70 transition-opacity"
    >
      <ChevronLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

