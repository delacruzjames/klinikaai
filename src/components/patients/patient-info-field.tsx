import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PatientInfoFieldProps = {
  label: string;
  value?: string | null;
  width?: `${number}%` | '100%';
};

export function PatientInfoField({ label, value, width = '100%' }: PatientInfoFieldProps) {
  const theme = useTheme();
  const trimmed = value?.trim();
  const isEmpty = !trimmed || trimmed === 'N/A';

  return (
    <View style={[styles.field, { width, backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      {isEmpty ? (
        <ThemedText style={[styles.valueNa, { color: theme.textSecondary }]}>N/A</ThemedText>
      ) : (
        <ThemedText type="smallBold" style={styles.value}>
          {trimmed}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.two,
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    lineHeight: 22,
  },
  valueNa: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
