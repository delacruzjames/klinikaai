import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();

  if (width >= DESKTOP_MIN) return 'desktop';
  if (width >= TABLET_MIN) return 'tablet';
  return 'mobile';
}

export function usePatientsPerPage(): number {
  const breakpoint = useBreakpoint();
  if (breakpoint === 'desktop') return 20;
  if (breakpoint === 'tablet') return 15;
  return 10;
}
