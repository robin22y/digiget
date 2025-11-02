import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/shop-owner.css';

interface PINModalProps {
  isOpen: boolean;
  menuName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PINModal({ isOpen, menuName, onSuccess, onCancel }: PINModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (pin.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get shop data for current user
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, owner_pin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (shopError || !shopData) {
        setError('Shop not found');
        setLoading(false);
        return;
      }

      // Verify owner PIN
      if (!shopData.owner_pin || shopData.owner_pin !== pin) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(t('security.wrong_pin'));
        setPin('');
        
        if (newAttempts >= 3) {
          // Lock out after 3 attempts
          setError(t('security.locked_out'));
          setTimeout(() => {
            setAttempts(0);
            setError('');
          }, 60000); // 1 minute lockout
        }
        
        setLoading(false);
        return;
      }

      // PIN correct
      onSuccess();
    } catch (err) {
      console.error('PIN verification error:', err);
      setError('Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(num: number) {
    if (pin.length < 6 && attempts < 3) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 6) {
        // Auto-submit when 6 digits entered
        setTimeout(() => handleSubmit(), 100);
      }
    }
  }

  function handleBackspace() {
    setPin(pin.slice(0, -1));
    setError('');
  }

  function handleClear() {
    setPin('');
    setError('');
  }

  return (
    <div 
      className="modal-overlay"
      onClick={onCancel}
    >
      <div 
        className="modal-content modal-pin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🔒 {t('security.enter_pin')}</h2>
          <button 
            onClick={onCancel} 
            className="modal-close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="text-gray-600 mb-3">
            {t('security.accessing')} <strong>{menuName}</strong>
          </p>

          <p className="text-gray-600 mb-3">
            {t('security.enter_6_digit')}
          </p>

          {/* PIN Display */}
          <div className="pin-display">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`pin-dot ${pin[i] ? 'filled' : ''}`}
              >
                {pin[i] && '•'}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              {error}
              {attempts > 0 && attempts < 3 && (
                <p className="mb-0 mt-1 text-sm">
                  {t('security.attempts_remaining')}: {3 - attempts}
                </p>
              )}
            </div>
          )}

          {/* Keypad */}
          <div className="keypad">
            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="keypad-button"
                  disabled={loading || attempts >= 3}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="keypad-button keypad-backspace"
                disabled={loading || pin.length === 0}
              >
                ←
              </button>
              <button
                onClick={() => handleKeyPress(0)}
                className="keypad-button"
                disabled={loading || attempts >= 3}
              >
                0
              </button>
              <button
                onClick={handleClear}
                className="keypad-button keypad-clear"
                disabled={loading || pin.length === 0}
              >
                C
              </button>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="btn btn-secondary btn-block mt-3"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

