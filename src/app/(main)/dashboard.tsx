import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function DashboardHomeScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <ThemedText type="title">Dashboard</ThemedText>
      <ThemedText themeColor="textSecondary">
        Welcome back, {user?.email}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{user?.subDomain}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
