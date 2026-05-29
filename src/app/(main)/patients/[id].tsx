import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { PatientDetailView } from '@/components/patients/patient-detail-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { fetchPatientById, type PatientDetail } from '@/services/patients-api';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const theme = useTheme();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatient = useCallback(async () => {
    if (!token || !id) {
      setError('Unable to load patient.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchPatientById(token, id);
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient.');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
      ) : null}

      {error ? (
        <View style={styles.messageBlock}>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
          <Pressable onPress={loadPatient} accessibilityRole="button">
            <ThemedText type="linkPrimary">Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {patient && !loading ? <PatientDetailView patient={patient} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  loader: {
    marginTop: Spacing.six,
  },
  messageBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
});
