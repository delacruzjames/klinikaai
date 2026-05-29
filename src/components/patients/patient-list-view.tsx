import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientAvatar } from '@/components/patients/patient-avatar';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import type { Patient } from '@/services/patients-api';

function PatientRowCard({
  patient,
  onPress,
}: {
  patient: Patient;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        PatientUI.cardShadowLight,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${patient.fullname}`}>
      <PatientAvatar
        fullname={patient.fullname}
        firstName={patient.first_name}
        lastName={patient.last_name}
        avatarUrl={patient.avatar_url}
        size={48}
      />
      <View style={styles.cardBody}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.cardName}>
          {patient.fullname}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {patient.age}
        </ThemedText>
        {patient.tel_or_mobile !== 'N/A' ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {patient.tel_or_mobile}
          </ThemedText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

type PatientListViewProps = {
  patients: Patient[];
  onPatientPress: (patient: Patient) => void;
};

export function PatientListView({ patients, onPatientPress }: PatientListViewProps) {
  const breakpoint = useBreakpoint();
  const isTablet = breakpoint !== 'mobile';
  const theme = useTheme();

  if (patients.length === 0) return null;

  if (isTablet) {
    return (
      <View
        style={[
          styles.tabletCard,
          PatientUI.cardShadow,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}>
        <View style={[styles.tabletHeader, { borderBottomColor: theme.backgroundSelected }]}>
          <ThemedText style={styles.tabletHeaderCell} themeColor="textSecondary">
            Patient
          </ThemedText>
          <ThemedText style={[styles.tabletHeaderCell, styles.colAge]} themeColor="textSecondary">
            Age
          </ThemedText>
          <ThemedText style={[styles.tabletHeaderCell, styles.colContact]} themeColor="textSecondary">
            Contact
          </ThemedText>
          <ThemedText style={[styles.tabletHeaderCell, styles.colDate]} themeColor="textSecondary">
            Added
          </ThemedText>
        </View>
        {patients.map((patient, index) => (
          <Pressable
            key={patient.id}
            onPress={() => onPatientPress(patient)}
            style={({ pressed }) => [
              styles.tabletRow,
              pressed && { backgroundColor: theme.backgroundElement },
              index < patients.length - 1 && {
                borderBottomColor: theme.backgroundSelected,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`View ${patient.fullname}`}>
            <View style={styles.colName}>
              <PatientAvatar
                fullname={patient.fullname}
                firstName={patient.first_name}
                lastName={patient.last_name}
                avatarUrl={patient.avatar_url}
                size={40}
              />
              <ThemedText type="smallBold" style={styles.tabletName} numberOfLines={1}>
                {patient.fullname}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.colAge} numberOfLines={2}>
              {patient.age}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.colContact} numberOfLines={1}>
              {patient.tel_or_mobile}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.colDate} numberOfLines={2}>
              {patient.date_created}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {patients.map(patient => (
        <PatientRowCard key={patient.id} patient={patient} onPress={() => onPatientPress(patient)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 16,
  },
  tabletCard: {
    marginHorizontal: Spacing.four,
    borderRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  tabletHeaderCell: {
    flex: 2.4,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    minHeight: 64,
  },
  colName: {
    flex: 2.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
  tabletName: {
    flex: 1,
  },
  colAge: {
    flex: 1.3,
    paddingRight: Spacing.two,
  },
  colContact: {
    flex: 1.2,
    paddingRight: Spacing.two,
  },
  colDate: {
    flex: 1,
  },
});
