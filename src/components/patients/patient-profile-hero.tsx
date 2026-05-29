import { StyleSheet, View } from 'react-native';

import { PatientAvatar } from '@/components/patients/patient-avatar';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PatientDetail } from '@/services/patients-api';

type PatientProfileHeroProps = {
  patient: PatientDetail;
};

export function PatientProfileHero({ patient }: PatientProfileHeroProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.hero,
        PatientUI.cardShadow,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <PatientAvatar
        fullname={patient.fullname}
        firstName={patient.first_name}
        lastName={patient.last_name}
        avatarUrl={patient.avatar_url}
        size={64}
      />
      <View style={styles.heroText}>
        <ThemedText style={styles.name} numberOfLines={2}>
          {patient.fullname}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {patient.age}
        </ThemedText>
        {patient.tel_or_mobile && patient.tel_or_mobile !== 'N/A' ? (
          <ThemedText type="small" style={styles.meta}>
            {patient.tel_or_mobile}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    padding: Spacing.four,
    borderRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  meta: {
    color: Brand.primary,
    marginTop: 2,
  },
});
