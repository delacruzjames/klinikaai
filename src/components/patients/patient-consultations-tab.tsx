import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ConsultationDetailLoader } from '@/components/consultations/consultation-detail-view';
import { ConsultationListView } from '@/components/consultations/consultation-list-view';
import { ConsultationsEmptyState } from '@/components/consultations/consultations-empty-state';
import { ConsultationsSearchBar } from '@/components/consultations/consultations-search-bar';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  fetchPatientConsultations,
  searchPatientConsultations,
  type Consultation,
} from '@/services/consultations-api';
import type { PatientDetail } from '@/services/patients-api';

type PatientConsultationsTabProps = {
  patient: PatientDetail;
  patientId: number;
  isActive: boolean;
  selectedConsultationId: number | null;
  onSelectConsultation: (consultationId: number | null) => void;
};

export function PatientConsultationsTab({
  patient,
  patientId,
  isActive,
  selectedConsultationId,
  onSelectConsultation,
}: PatientConsultationsTabProps) {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useTheme();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadConsultations = useCallback(
    async (mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setError('You are not signed in.');
        return;
      }

      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = debouncedSearch
          ? await searchPatientConsultations(token, patientId, debouncedSearch)
          : await fetchPatientConsultations(token, patientId);
        setConsultations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load consultations.');
        setConsultations([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, patientId, token]
  );

  useEffect(() => {
    if (isActive) loadConsultations();
  }, [isActive, loadConsultations]);

  const openConsultation = (consultation: Consultation) => {
    onSelectConsultation(consultation.id);
    router.push({
      pathname: '/patients/[id]/consultations/[consultationId]',
      params: {
        id: String(patientId),
        consultationId: String(consultation.id),
      },
    });
  };

  if (selectedConsultationId != null) {
    return (
      <ConsultationDetailLoader
        patientId={patientId}
        consultationId={selectedConsultationId}
        patient={patient}
        embedded
      />
    );
  }

  if (loading && consultations.length === 0 && !error) {
    return (
      <ConsultationsPanel>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <ThemedText type="small" themeColor="textSecondary">
            Loading consultations…
          </ThemedText>
        </View>
      </ConsultationsPanel>
    );
  }

  if (error && consultations.length === 0) {
    return (
      <ConsultationsPanel>
        <View style={[styles.centered, styles.errorBox]}>
          <View style={[styles.stateIcon, { backgroundColor: Brand.primaryMuted }]}>
            <Ionicons name="cloud-offline-outline" size={28} color={Brand.primary} />
          </View>
          <ThemedText type="smallBold">Couldn&apos;t load consultations</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable
            onPress={() => loadConsultations()}
            style={[styles.retryBtn, { backgroundColor: Brand.primary }]}
            accessibilityRole="button">
            <ThemedText style={styles.retryBtnText}>Try again</ThemedText>
          </Pressable>
        </View>
      </ConsultationsPanel>
    );
  }

  return (
    <ConsultationsPanel>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>Consultations</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {consultations.length === 0 && !loading
              ? 'Visit history for this patient'
              : `${consultations.length} consultation${consultations.length === 1 ? '' : 's'}`}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => loadConsultations('refresh')}
          disabled={loading || refreshing}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Refresh consultations">
          {refreshing ? (
            <ActivityIndicator size="small" color={Brand.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={theme.text} />
          )}
        </Pressable>
      </View>

      <ConsultationsSearchBar value={search} onChangeText={setSearch} />

      {error ? (
        <View style={[styles.inlineError, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
          <Pressable onPress={() => loadConsultations()} accessibilityRole="button">
            <ThemedText type="linkPrimary">Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {consultations.length === 0 && !loading ? (
        <ConsultationsEmptyState
          subtitle={
            debouncedSearch
              ? 'Try a different search term.'
              : 'Consultation records will appear here once created.'
          }
        />
      ) : (
        <ConsultationListView
          consultations={consultations}
          showBranch
          showPatient={false}
          onConsultationPress={openConsultation}
        />
      )}
    </ConsultationsPanel>
  );
}

function ConsultationsPanel({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        PatientUI.cardShadow,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
  errorBox: {
    minHeight: 200,
    paddingHorizontal: Spacing.three,
  },
  errorText: {
    textAlign: 'center',
    maxWidth: 280,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: PatientUI.radius.md,
    marginTop: Spacing.two,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  panel: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.lg,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.md,
  },
});
