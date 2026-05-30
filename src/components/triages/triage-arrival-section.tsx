import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

type TriageArrivalSectionProps = {
  search: string;
  onSearchChange: (value: string) => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function TriageArrivalSection({
  search,
  onSearchChange,
  children,
  footer,
}: TriageArrivalSectionProps) {
  const theme = useTheme();
  const isMobile = useBreakpoint() === 'mobile';

  return (
    <View
      style={[
        styles.card,
        PatientUI.cardShadowLight,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
        isMobile && styles.cardMobile,
      ]}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerText}>
            <ThemedText type="subtitle" style={styles.title}>
              Arrival Queue
            </ThemedText>
          </View>
          <View
            style={[
              styles.searchWrap,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}>
            <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search patient..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={onSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Search triage queue"
            />
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Patients awaiting initial triage
        </ThemedText>
      </View>

      {children}

      {footer}
    </View>
  );
}

export function TriageArrivalFooter() {
  return (
    <View style={styles.footer}>
      <Pressable style={styles.viewAll} accessibilityRole="button">
        <ThemedText type="smallBold" style={styles.viewAllText}>
          View all arrivals
        </ThemedText>
        <Ionicons name="chevron-down" size={14} color={Brand.primary} />
      </Pressable>

      <View style={[styles.infoBanner, { backgroundColor: Brand.primaryMuted }]}>
        <Ionicons name="information-circle-outline" size={18} color={Brand.primary} />
        <ThemedText type="small" style={styles.infoText}>
          Triage is the first step. Record initial vitals to move patients to the consultation queue.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: Spacing.four,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardMobile: {
    marginHorizontal: Spacing.three,
  },
  header: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
  },
  searchWrap: {
    width: '50%',
    maxWidth: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.two,
  },
  footer: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E1E6',
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewAllText: {
    color: Brand.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
  },
  infoText: {
    flex: 1,
    color: Brand.primary,
    lineHeight: 18,
  },
});
