import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const WELCOME_DELAY_MS = 2200;
const BRAND_BLUE = '#208AEF';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated, isSigningIn, signIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setShowLogin(true), WELCOME_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      await signIn(email, password);
      router.replace('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in.';
      setError(message);
    }
  };

  if (!showLogin) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.welcomeBox}>
            <ThemedText type="title" style={styles.brandTitle}>
              KlinikaAI
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centered}>
              Preparing your clinic workspace...
            </ThemedText>
            <ActivityIndicator size="large" color={BRAND_BLUE} style={styles.loader} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.header}>
                <ThemedText type="title" style={styles.brandTitle}>
                  KlinikaAI
                </ThemedText>
                <ThemedText type="subtitle" style={styles.centered}>
                  Sign in to your account
                </ThemedText>
              </View>

              <View style={styles.fields}>
                <FormField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@clinic.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!isSigningIn}
                  returnKeyType="next"
                />
                <FormField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  editable={!isSigningIn}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>

              {error ? (
                <View
                  style={[styles.errorBox, { backgroundColor: theme.backgroundElement }]}
                  accessibilityRole="alert">
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                  isSigningIn && styles.loginButtonDisabled,
                ]}
                disabled={isSigningIn}
                onPress={handleLogin}
                accessibilityRole="button"
                accessibilityLabel="Sign in">
                {isSigningIn ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText type="smallBold" style={styles.buttonText}>
                    Sign in
                  </ThemedText>
                )}
              </Pressable>

              <ThemedText type="small" themeColor="textSecondary" style={styles.demoHint}>
                Demo: admin@klinikaai.com · Klinika123!
              </ThemedText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  welcomeBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  brandTitle: {
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  fields: {
    gap: Spacing.three,
  },
  loader: {
    marginTop: Spacing.three,
  },
  errorBox: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: '#c81e1e',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  loginButton: {
    marginTop: Spacing.one,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: BRAND_BLUE,
  },
  loginButtonPressed: {
    opacity: 0.88,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
  },
  demoHint: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
