import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

type QueuesToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  totalRecords: number;
  loading?: boolean;
};

export function QueuesToolbar({
  search,
  onSearchChange,
  totalRecords,
  loading,
}: QueuesToolbarProps) {
  const theme = useTheme();
  const isTablet = useBreakpoint() !== 'mobile';

  const countLabel = loading
    ? 'Loading…'
    : totalRecords === 0
      ? 'Queue empty'
      : `${totalRecords} waiting`;

  return (
    <View style={[styles.wrapper, isTablet && styles.wrapperTablet]}>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.background },
          isTablet && styles.heroTablet,
        ]}>
        <View style={[styles.accentBar, { backgroundColor: Brand.primary }]} />
        <View style={styles.heroContent}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: Brand.primaryMuted }]}>
              <Ionicons name="hourglass-outline" size={22} color={Brand.primary} />
            </View>
            <View style={styles.titleText}>
              <ThemedText style={styles.title}>Queue</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Patients ready for consultation
              </ThemedText>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
            <View style={[styles.badgeDot, { backgroundColor: Brand.primary }]} />
            <ThemedText type="smallBold" style={styles.badgeText}>
              {countLabel}
            </ThemedText>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.searchWrap,
          PatientUI.cardShadowLight,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
          isTablet && styles.searchWrapTablet,
        ]}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name or complaint"
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search queue"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  wrapperTablet: {
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.four,
  },
  hero: {
    borderRadius: PatientUI.radius.lg,
    overflow: 'hidden',
    ...PatientUI.cardShadowLight,
  },
  heroTablet: {
    flex: 1,
    minWidth: 0,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  heroContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    color: Brand.primary,
    fontSize: 13,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
  },
  searchWrapTablet: {
    flex: 1,
    minWidth: 280,
    maxWidth: 420,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
});
