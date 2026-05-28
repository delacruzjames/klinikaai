import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { MAIN_NAV_ITEMS } from '@/constants/navigation';
import { Spacing } from '@/constants/theme';

const EXPANDED_WIDTH = 232;
const COLLAPSED_WIDTH = 72;
const BRAND_BLUE = '#208AEF';
const SIDEBAR_BG = '#1e293b';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed, onToggle, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <View style={[styles.sidebar, { width }]}>
      <View style={styles.brandRow}>
        {!collapsed ? (
          <ThemedText type="smallBold" style={styles.brandText}>
            KlinikaAI
          </ThemedText>
        ) : (
          <ThemedText type="smallBold" style={styles.brandText}>
            K
          </ThemedText>
        )}
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
          accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Ionicons
            name={collapsed ? 'chevron-forward-outline' : 'chevron-back-outline'}
            size={18}
            color="#94a3b8"
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.nav} showsVerticalScrollIndicator={false}>
        {MAIN_NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => {
                router.push(item.href);
                onNavigate?.();
              }}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && styles.pressed,
              ]}>
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? '#ffffff' : '#94a3b8'}
              />
              {!collapsed ? (
                <ThemedText
                  type="small"
                  style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </ThemedText>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const SIDEBAR_WIDTHS = { expanded: EXPANDED_WIDTH, collapsed: COLLAPSED_WIDTH };

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: SIDEBAR_BG,
    borderRightWidth: 1,
    borderRightColor: '#334155',
    paddingTop: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.three,
    minHeight: 40,
  },
  brandText: {
    color: '#f8fafc',
  },
  toggle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
    paddingBottom: Spacing.four,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  navItemActive: {
    backgroundColor: BRAND_BLUE,
  },
  navLabel: {
    color: '#cbd5e1',
  },
  navLabelActive: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.85,
  },
});
