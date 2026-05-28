import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <View style={styles.row}>
        <ThemedText type="smallBold">Email</ThemedText>
        <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText type="smallBold">Clinic</ThemedText>
        <ThemedText themeColor="textSecondary">{user?.subDomain}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.one,
  },
});
