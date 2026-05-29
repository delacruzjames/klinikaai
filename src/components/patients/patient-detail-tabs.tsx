import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PatientDetailTabKey =
  | 'details'
  | 'vitals'
  | 'growth-chart'
  | 'medical-history'
  | 'consultations'
  | 'consultation-form'
  | 'prescriptions'
  | 'medical-certificates';

export const PATIENT_DETAIL_TABS: { key: PatientDetailTabKey; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'growth-chart', label: 'Growth' },
  { key: 'medical-history', label: 'History' },
  { key: 'consultations', label: 'Consults' },
  { key: 'consultation-form', label: 'Form' },
  { key: 'prescriptions', label: 'Rx' },
  { key: 'medical-certificates', label: 'Certs' },
];

type PatientDetailTabsProps = {
  activeTab: PatientDetailTabKey;
  onTabChange: (tab: PatientDetailTabKey) => void;
};

export function PatientDetailTabs({ activeTab, onTabChange }: PatientDetailTabsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.backgroundElement }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {PATIENT_DETAIL_TABS.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isActive ? Brand.primary : theme.background,
                  borderColor: isActive ? Brand.primary : theme.backgroundSelected,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}>
              <ThemedText
                type="smallBold"
                style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: Spacing.three,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: {
    fontSize: 13,
  },
  chipLabelActive: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.85,
  },
});
