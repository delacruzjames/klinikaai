import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { LockScreenOverlay } from '@/components/dashboard/lock-screen-overlay';
import { SIDEBAR_WIDTHS, Sidebar } from '@/components/dashboard/sidebar';
import { ThemedView } from '@/components/themed-view';
import { MAIN_NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/auth-context';

function getScreenTitle(pathname: string): string {
  const item = MAIN_NAV_ITEMS.find(nav => {
    if (nav.href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === nav.href || pathname.startsWith(`${nav.href}/`);
  });
  if (item) return item.label;
  if (pathname.includes('profile')) return 'Profile';
  if (pathname.includes('update-password')) return 'Update Password';
  return 'KlinikaAI';
}

export function DashboardShell() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const { isLocked } = useAuth();
  const isCompact = width < 900;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const showSidebar = !isCompact || mobileOpen;

  const toggleSidebar = () => {
    if (isCompact) {
      setMobileOpen(open => !open);
      return;
    }
    setCollapsed(value => !value);
  };

  const closeMobileSidebar = () => {
    if (isCompact) setMobileOpen(false);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.body}>
          {showSidebar && isCompact ? (
            <View style={styles.mobileSidebar}>
              <Sidebar
                collapsed={false}
                onToggle={toggleSidebar}
                onNavigate={closeMobileSidebar}
              />
            </View>
          ) : null}

          {showSidebar && !isCompact ? (
            <Sidebar
              collapsed={collapsed}
              onToggle={toggleSidebar}
            />
          ) : null}

          {isCompact && mobileOpen ? (
            <Pressable style={styles.backdrop} onPress={closeMobileSidebar} />
          ) : null}

          <View style={styles.main}>
            <DashboardHeader
              title={getScreenTitle(pathname)}
              onMenuPress={toggleSidebar}
              showMenuButton={isCompact || collapsed}
            />
            <View style={styles.content}>
              <Slot />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {isLocked ? <LockScreenOverlay /> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  mobileSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 8,
  },
});
