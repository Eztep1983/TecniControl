import { useState, useEffect, useCallback } from 'react';
import { useCompletarOnboarding } from '@/hooks/useMultiUser';

export function useOnboardingFlow(user: any, statsLoading: boolean, negocioLoading: boolean, negocio: any, totalOrdenes: number) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOnboardingMode, setIsOnboardingMode] = useState(false);
  const { mutate: markOnboardingCompleted } = useCompletarOnboarding();

  useEffect(() => {
    if (!user?.uid || statsLoading || negocioLoading) return;

    if (negocio?.onboardingCompleted) {
      if (showWelcome) setShowWelcome(false);
      return;
    }

    if (totalOrdenes > 0) {
      markOnboardingCompleted();
      return;
    }

    setShowWelcome(true);
  }, [user?.uid, statsLoading, negocioLoading, negocio?.onboardingCompleted, totalOrdenes, markOnboardingCompleted]);

  const startOnboarding = useCallback(() => {
    setShowWelcome(false);
    setIsOnboardingMode(true);
  }, []);

  const skipOnboarding = useCallback(() => {
    setShowWelcome(false);
    markOnboardingCompleted();
  }, [markOnboardingCompleted]);

  const finishOnboarding = useCallback(() => {
    setIsOnboardingMode(false);
    setShowSuccess(true);
  }, []);

  const closeSuccess = useCallback(() => {
    setShowSuccess(false);
    markOnboardingCompleted();
  }, [markOnboardingCompleted]);

  return {
    showWelcome,
    showSuccess,
    isOnboardingMode,
    startOnboarding,
    skipOnboarding,
    finishOnboarding,
    closeSuccess,
    setIsOnboardingMode
  };
}
