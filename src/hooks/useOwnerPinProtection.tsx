import { useState, useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerPinModal from '../components/OwnerPinModal';

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

    const checkUnlockStatus = () => {
      const unlocked = sessionStorage.getItem(`owner_unlocked_${shopId}`);
      const unlockTime = sessionStorage.getItem(`owner_unlock_time_${shopId}`);

      // Security: Check if we're returning from an external page (shop portal, tablet, staff portal)
      // If so, require PIN again regardless of unlock status
      const referrer = document.referrer;
      const isReturningFromExternal = referrer && (
        referrer.includes('/shop/') || 
        referrer.includes('/tablet/') || 
        referrer.includes('/staff/')
      );

      if (isReturningFromExternal && unlocked === 'true') {
        // Clear unlock status when returning from external pages
        sessionStorage.removeItem(`owner_unlocked_${shopId}`);
        sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
        setIsUnlocked(false);
        setShowPinModal(true);
        setChecking(false);
        return;
      }

      if (unlocked === 'true' && unlockTime) {
        // Check if unlock is still valid (30 minutes)
        const timeSinceUnlock = Date.now() - parseInt(unlockTime, 10);
        const UNLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

        if (timeSinceUnlock < UNLOCK_DURATION) {
          setIsUnlocked(true);
          setShowPinModal(false);
          setChecking(false);
          return;
        } else {
          // Unlock expired
          sessionStorage.removeItem(`owner_unlocked_${shopId}`);
          sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
        }
      }

      // Not unlocked or expired - show PIN modal
      setIsUnlocked(false);
      setShowPinModal(true);
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

  const handleLock = () => {
    if (shopId) {
      sessionStorage.removeItem(`owner_unlocked_${shopId}`);
      sessionStorage.removeItem(`owner_unlock_time_${shopId}`);
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

