import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export function LockScreenOverlay() {
  const { user, unlockScreen } = useAuth();

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Ionicons name="lock-closed-outline" size={48} color="#ffffff" />
        <ThemedText type="title" style={styles.title}>
          Screen locked
        </ThemedText>
        <ThemedText style={styles.subtitle}>{user?.email}</ThemedText>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={unlockScreen}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            Unlock
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  button: {
    marginTop: Spacing.two,
    backgroundColor: '#208AEF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderRadius: Spacing.two,
  },
  buttonText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.88,
  },
});
