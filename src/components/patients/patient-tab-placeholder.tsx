import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PatientTabPlaceholderProps = {
  title: string;
};

export function PatientTabPlaceholder({ title }: PatientTabPlaceholderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        PatientUI.cardShadow,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: Brand.primaryMuted }]}>
        <Ionicons name="construct-outline" size={28} color={Brand.primary} />
      </View>
      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        This section is coming soon in the mobile app.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.lg,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
