import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { NAV_SECTIONS, type NavItem } from '@/constants/navigation';
import { Brand, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed, onToggle, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const palette = {
    activeBg: isDark ? 'rgba(32, 138, 239, 0.16)' : Brand.primaryMuted,
    activeBorder: Brand.primary,
    iconMuted: theme.textSecondary,
    footerBg: isDark ? theme.backgroundElement : '#f7f8fa',
    toggleBorder: theme.backgroundSelected,
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navigate = (href: NavItem['href']) => {
    router.push(href);
    onNavigate?.();
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          width,
          backgroundColor: theme.background,
          borderRightColor: theme.backgroundSelected,
        },
      ]}>
      <View style={[styles.header, collapsed && styles.headerCollapsed]}>
        <View style={[styles.logoMark, collapsed && styles.logoMarkCollapsed]}>
          <Ionicons name="pulse" size={collapsed ? 18 : 20} color="#ffffff" />
        </View>
        {!collapsed ? (
          <View style={styles.brandCopy}>
            <ThemedText type="smallBold" style={styles.brandTitle}>
              KlinikaAI
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.brandTagline}>
              Clinic workspace
            </ThemedText>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.nav, collapsed && styles.navCollapsed]}
        showsVerticalScrollIndicator={false}>
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <View
            key={section.title}
            style={[styles.section, sectionIndex > 0 && styles.sectionSpaced]}>
            {!collapsed ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                {section.title.toUpperCase()}
              </ThemedText>
            ) : null}
            {section.items.map(item => {
              const active = isActive(item.href);
              return (
                <Pressable
                  key={item.href}
                  onPress={() => navigate(item.href)}
                  style={({ pressed }) => [
                    styles.navItem,
                    collapsed && styles.navItemCollapsed,
                    active && { backgroundColor: palette.activeBg },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  {active && !collapsed ? (
                    <View style={[styles.activeBar, { backgroundColor: palette.activeBorder }]} />
                  ) : null}
                  <View style={[styles.iconWrap, collapsed && styles.iconWrapCollapsed]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={active ? Brand.primary : palette.iconMuted}
                    />
                  </View>
                  {!collapsed ? (
                    <ThemedText
                      type="small"
                      themeColor={active ? undefined : 'textSecondary'}
                      style={[styles.navLabel, active && styles.navLabelActive]}
                      numberOfLines={1}>
                      {item.label}
                    </ThemedText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.backgroundSelected }]}>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [
            styles.collapseButton,
            { backgroundColor: palette.footerBg, borderColor: palette.toggleBorder },
            collapsed && styles.collapseButtonCollapsed,
            pressed && styles.pressed,
          ]}
          accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-back'}
            size={16}
            color={theme.textSecondary}
          />
          {!collapsed ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.collapseLabel}>
              Collapse
            </ThemedText>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

export const SIDEBAR_WIDTHS = { expanded: EXPANDED_WIDTH, collapsed: COLLAPSED_WIDTH };

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 1,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    marginBottom: Spacing.one,
  },
  headerCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {
        boxShadow: '0 8px 20px rgba(32, 138, 239, 0.28)',
      },
    }),
  },
  logoMarkCollapsed: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  brandTitle: {
    letterSpacing: -0.2,
  },
  brandTagline: {
    fontSize: 12,
    lineHeight: 16,
  },
  nav: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.three,
  },
  navCollapsed: {
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
  },
  section: {
    gap: Spacing.half,
  },
  sectionSpaced: {
    marginTop: Spacing.two,
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 600,
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.half,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  navItemCollapsed: {
    width: 48,
    height: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 3,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCollapsed: {
    width: '100%',
    height: '100%',
  },
  navLabel: {
    flex: 1,
    fontWeight: 500,
  },
  navLabelActive: {
    color: Brand.primary,
    fontWeight: 600,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  collapseButtonCollapsed: {
    width: 48,
    height: 44,
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  collapseLabel: {
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.82,
  },
});
