import { useState } from 'react';

interface DestructiveActionConfig {
  title: string;
  message: string;
  warningText?: string;
  actionType?: 'delete' | 'cancel' | 'danger';
  requireTypedConfirmation?: boolean;
  confirmationText?: string;
}

export function useDestructiveAction() {
  const [modalConfig, setModalConfig] = useState<DestructiveActionConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolveCallback, setResolveCallback] = useState<((confirmed: boolean) => void) | null>(null);

  /**
   * Show confirmation modal and wait for user response
   * Returns promise that resolves to true if confirmed, false if cancelled
   */
  async function confirmDestructiveAction(config: DestructiveActionConfig): Promise<boolean> {
    return new Promise((resolve) => {
      setModalConfig(config);
      setIsModalOpen(true);
      setResolveCallback(() => resolve);
    });
  }

  function handleConfirm() {
    setIsModalOpen(false);
    if (resolveCallback) {
      resolveCallback(true);
      setResolveCallback(null);
    }
    setModalConfig(null);
  }

  function handleCancel() {
    setIsModalOpen(false);
    if (resolveCallback) {
      resolveCallback(false);
      setResolveCallback(null);
    }
    setModalConfig(null);
  }

  return {
    confirmDestructiveAction,
    modalConfig,
    isModalOpen,
    handleConfirm,
    handleCancel
  };
}

