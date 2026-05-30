import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';

const KLINIKA_LOGO = require('@/assets/images/klinika-logo.png');
import { NAV_SECTIONS, type NavItem } from '@/constants/navigation';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { fetchCurrentEstablishment } from '@/services/establishment-api';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 80;
const COLLAPSE_DURATION = 280;
const COLLAPSE_EASING = Easing.bezier(0.4, 0, 0.2, 1);

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
  const { token } = useAuth();
  const [establishmentName, setEstablishmentName] = useState('');
  const isDark = colorScheme === 'dark';
  const progress = useSharedValue(collapsed ? 1 : 0);

  useEffect(() => {
    if (!token) {
      setEstablishmentName('');
      return;
    }

    let mounted = true;

    fetchCurrentEstablishment(token)
      .then(establishment => {
        if (mounted) {
          setEstablishmentName(establishment.name);
        }
      })
      .catch(() => {
        if (mounted) {
          setEstablishmentName('');
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    progress.value = withTiming(collapsed ? 1 : 0, {
      duration: COLLAPSE_DURATION,
      easing: COLLAPSE_EASING,
    });
  }, [collapsed, progress]);

  const sidebarStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [EXPANDED_WIDTH, COLLAPSED_WIDTH]),
  }));

  const headerStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(progress.value, [0, 1], [Spacing.three, Spacing.two]),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [44, 48]),
    height: interpolate(progress.value, [0, 1], [44, 48]),
    borderRadius: interpolate(progress.value, [0, 1], [12, 14]),
    overflow: 'hidden' as const,
  }));

  const labelFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(progress.value, [0, 0.45], [0, -8], Extrapolation.CLAMP),
      },
    ],
  }));

  const brandCopyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    maxWidth: interpolate(progress.value, [0, 0.5], [180, 0], Extrapolation.CLAMP),
    flexGrow: interpolate(progress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(progress.value, [0, 0.45], [0, -8], Extrapolation.CLAMP),
      },
    ],
  }));

  const sectionLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(progress.value, [0, 0.45], [22, 0], Extrapolation.CLAMP),
    marginBottom: interpolate(progress.value, [0, 0.45], [Spacing.half, 0], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  const navStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(progress.value, [0, 1], [Spacing.two, Spacing.one]),
  }));

  const navItemStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [EXPANDED_WIDTH - Spacing.two * 2, 48]),
    height: interpolate(progress.value, [0, 1], [44, 48]),
    paddingHorizontal: interpolate(progress.value, [0, 1], [Spacing.two, 0]),
    paddingVertical: interpolate(progress.value, [0, 1], [10, 0]),
    gap: interpolate(progress.value, [0, 1], [Spacing.two, 0]),
  }));

  const activeBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
  }));

  const collapseButtonStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [EXPANDED_WIDTH - Spacing.two * 2, 48]),
    height: interpolate(progress.value, [0, 1], [40, 48]),
    paddingHorizontal: interpolate(progress.value, [0, 1], [Spacing.three, 0]),
    gap: interpolate(progress.value, [0, 0.5], [Spacing.two, 0], Extrapolation.CLAMP),
  }));

  const collapseLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
    maxWidth: interpolate(progress.value, [0, 0.45], [96, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateX: interpolate(progress.value, [0, 0.4], [0, -6], Extrapolation.CLAMP),
      },
    ],
    overflow: 'hidden' as const,
  }));

  const collapseIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(progress.value, [0, 1], [Spacing.two, Spacing.one]),
  }));

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
    <Animated.View
      style={[
        styles.sidebar,
        sidebarStyle,
        {
          backgroundColor: theme.background,
          borderRightColor: theme.backgroundSelected,
        },
      ]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Animated.View style={logoStyle}>
          <Image
            source={KLINIKA_LOGO}
            style={styles.logoImage}
            contentFit="cover"
            accessibilityLabel="Klinika AI logo"
          />
        </Animated.View>
        <Animated.View style={[styles.brandCopy, brandCopyStyle]} pointerEvents={collapsed ? 'none' : 'auto'}>
          <ThemedText type="smallBold" style={styles.brandTitle} numberOfLines={1}>
            KlinikaAI
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.brandTagline} numberOfLines={1}>
            {establishmentName}
          </ThemedText>
        </Animated.View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.nav, navStyle]}>
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <View
              key={section.title}
              style={[styles.section, sectionIndex > 0 && styles.sectionSpaced]}>
              <Animated.View style={sectionLabelStyle} pointerEvents={collapsed ? 'none' : 'auto'}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                  {section.title.toUpperCase()}
                </ThemedText>
              </Animated.View>
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Pressable
                    key={item.href}
                    onPress={() => navigate(item.href)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}>
                    {({ pressed }) => (
                      <Animated.View
                        style={[
                          styles.navItem,
                          navItemStyle,
                          active && { backgroundColor: palette.activeBg },
                          pressed && styles.pressed,
                        ]}>
                        {active ? (
                          <Animated.View
                            style={[
                              styles.activeBar,
                              activeBarStyle,
                              { backgroundColor: palette.activeBorder },
                            ]}
                          />
                        ) : null}
                        <View style={styles.iconWrap}>
                          <Ionicons
                            name={item.icon}
                            size={20}
                            color={active ? Brand.primary : palette.iconMuted}
                          />
                        </View>
                        <Animated.View
                          style={[styles.navLabelWrap, labelFadeStyle]}
                          pointerEvents={collapsed ? 'none' : 'auto'}>
                          <ThemedText
                            type="small"
                            themeColor={active ? undefined : 'textSecondary'}
                            style={[styles.navLabel, active && styles.navLabelActive]}
                            numberOfLines={1}>
                            {item.label}
                          </ThemedText>
                        </Animated.View>
                      </Animated.View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.footer, footerStyle, { borderTopColor: theme.backgroundSelected }]}>
        <Pressable
          onPress={onToggle}
          style={styles.collapsePressable}
          accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          accessibilityRole="button">
          {({ pressed }) => (
            <Animated.View
              style={[
                styles.collapseButton,
                collapseButtonStyle,
                { backgroundColor: palette.footerBg, borderColor: palette.toggleBorder },
                pressed && styles.collapseButtonPressed,
              ]}>
              <Animated.View style={[styles.collapseIcon, collapseIconStyle]}>
                <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
              </Animated.View>
              <Animated.View
                style={[styles.collapseLabelWrap, collapseLabelStyle]}
                pointerEvents={collapsed ? 'none' : 'auto'}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.collapseLabel}>
                  Collapse
                </ThemedText>
              </Animated.View>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export const SIDEBAR_WIDTHS = { expanded: EXPANDED_WIDTH, collapsed: COLLAPSED_WIDTH };

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 1,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    marginBottom: Spacing.one,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: Brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {
        boxShadow: '0 6px 16px rgba(32, 138, 239, 0.22)',
      },
    }),
  },
  brandCopy: {
    minWidth: 0,
    gap: 2,
    overflow: 'hidden',
  },
  brandTitle: {
    letterSpacing: -0.2,
  },
  brandTagline: {
    fontSize: 12,
    lineHeight: 16,
  },
  nav: {
    paddingBottom: Spacing.three,
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
    alignSelf: 'center',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
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
    flexShrink: 0,
  },
  navLabelWrap: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  navLabel: {
    fontWeight: 500,
  },
  navLabelActive: {
    color: Brand.primary,
    fontWeight: 600,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  collapsePressable: {
    alignItems: 'center',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  collapseIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  collapseLabelWrap: {
    overflow: 'hidden',
  },
  collapseLabel: {
    fontWeight: 500,
  },
  collapseButtonPressed: {
    opacity: 0.78,
  },
  pressed: {
    opacity: 0.82,
  },
});
