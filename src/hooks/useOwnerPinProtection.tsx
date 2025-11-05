import { useState, useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerPinModal from '../components/OwnerPinModal';
import { hasOwnerAccess } from '../utils/ownerAccess';

interface UseOwnerPinProtectionOptions {
  shopId: string | null;
  onCancel?: () => void;
}

interface UseOwnerPinProtectionReturn {
  isUnlocked: boolean;
  checking: boolean;
  showPinModal: boolean;
  handleLock: () => void;
  PinProtectionModal: () => ReactElement | null;
}

export function useOwnerPinProtection({ shopId, onCancel }: UseOwnerPinProtectionOptions): UseOwnerPinProtectionReturn {
  const navigate = useNavigate();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!shopId) {
      setChecking(false);
      return;
    }

    const checkUnlockStatus = async () => {
      // Security: Check if we're returning from an external page (shop portal, tablet, staff portal)
      // If so, require PIN again regardless of unlock status
      const referrer = document.referrer;
      const isReturningFromExternal = referrer && (
        referrer.includes('/shop/') || 
        referrer.includes('/tablet/') || 
        referrer.includes('/staff/')
      );

      if (isReturningFromExternal) {
        // Always require PIN when returning from external pages
        setIsUnlocked(false);
        setShowPinModal(true);
        setChecking(false);
        return;
      }

      // Check server-side cookie for access
      const hasAccess = await hasOwnerAccess(shopId);
      
      if (hasAccess) {
        setIsUnlocked(true);
        setShowPinModal(false);
      } else {
        // Not unlocked - show PIN modal
        setIsUnlocked(false);
        setShowPinModal(true);
      }
      
      setChecking(false);
    };

    checkUnlockStatus();

    // Check unlock status periodically (every minute)
    const interval = setInterval(checkUnlockStatus, 60000);

    return () => clearInterval(interval);
  }, [shopId]);

  const handlePinSuccess = () => {
    setIsUnlocked(true);
    setShowPinModal(false);
  };

  const handleLock = async () => {
    if (shopId) {
      // Clear access by calling clear endpoint (server will clear cookie)
      await fetch(`/.netlify/functions/clear-cookie?shopId=${encodeURIComponent(shopId)}`, {
        method: 'POST',
        credentials: 'include',
      });
      setIsUnlocked(false);
      setShowPinModal(true);
    }
  };

  const PinProtectionModal = () => {
    if (!shopId || !showPinModal) return null;

    return (
      <OwnerPinModal
        shopId={shopId}
        onSuccess={handlePinSuccess}
        onCancel={onCancel || (() => navigate('/dashboard'))}
      />
    );
  };

  return {
    isUnlocked,
    checking,
    showPinModal,
    handleLock,
    PinProtectionModal,
  };
}

