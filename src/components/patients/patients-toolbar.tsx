import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

type PatientsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  totalRecords: number;
  loading?: boolean;
  onAddPatient?: () => void;
};

export function PatientsToolbar({
  search,
  onSearchChange,
  totalRecords,
  loading,
  onAddPatient,
}: PatientsToolbarProps) {
  const theme = useTheme();
  const isTablet = useBreakpoint() !== 'mobile';

  const countLabel = loading
    ? 'Loading…'
    : totalRecords === 0
      ? 'No patients'
      : `${totalRecords} patient${totalRecords === 1 ? '' : 's'}`;

  return (
    <View style={[styles.wrapper, isTablet && styles.wrapperTablet]}>
      <View style={styles.titleBlock}>
        <ThemedText style={styles.title}>Patients</ThemedText>
        <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
          <ThemedText type="smallBold" style={styles.badgeText}>
            {countLabel}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <View
          style={[
            styles.searchWrap,
            PatientUI.cardShadowLight,
            {
              backgroundColor: theme.background,
              borderColor: theme.backgroundSelected,
            },
          ]}>
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search patients"
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Search patients"
          />
        </View>

        <Pressable
          onPress={onAddPatient}
          style={({ pressed }) => [
            styles.addButton,
            PatientUI.cardShadow,
            { backgroundColor: Brand.primary, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add patient">
          <Ionicons name="add" size={24} color="#ffffff" />
        </Pressable>
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
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 2,
    borderRadius: 20,
  },
  badgeText: {
    color: Brand.primary,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: PatientUI.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
