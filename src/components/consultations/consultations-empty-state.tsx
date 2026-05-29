import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

type ConsultationsEmptyStateProps = {
  title?: string;
  subtitle: string;
};

export function ConsultationsEmptyState({
  title = 'No consultations found',
  subtitle,
}: ConsultationsEmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: Brand.primaryMuted }]}>
        <Ionicons name="document-text-outline" size={32} color={Brand.primary} />
      </View>
      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
        {subtitle}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    marginTop: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
});
