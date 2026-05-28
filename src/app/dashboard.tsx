import { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';

export default function DashboardScreen() {
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSignOut = () => {
    signOut();
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            KlinikaAI Dashboard
          </ThemedText>
          <ThemedText style={styles.subtitle}>Welcome, {user?.email}</ThemedText>
          <ThemedText style={styles.subtitle}>
            You are signed in successfully.
          </ThemedText>

          <Pressable style={styles.button} onPress={handleSignOut}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Sign Out
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  buttonText: {
    color: '#ffffff',
  },
});
