import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/context/auth-context';

export default function MainLayout() {
  const router = useRouter();
  const { isAuthenticated, isRestoring } = useAuth();

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isRestoring, router]);

  if (isRestoring || !isAuthenticated) {
    return null;
  }

  return <DashboardShell />;
}
