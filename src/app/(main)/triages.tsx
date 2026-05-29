import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PaginationControls } from '@/components/patients/pagination-controls';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import type { GeneralVitalsFormValues } from '@/constants/general-vitals-fields';
import { GeneralVitalsModal } from '@/components/triages/general-vitals-modal';
import { TriageListView } from '@/components/triages/triage-list-view';
import { TriagesToolbar } from '@/components/triages/triages-toolbar';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePatientsPerPage } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { fetchTriages, submitVisitVitals, type TriageVisit } from '@/services/triages-api';

export default function TriagesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useTheme();
  const perPage = usePatientsPerPage();
  const scrollRef = useRef<ScrollView>(null);

  const [visits, setVisits] = useState<TriageVisit[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vitalsVisit, setVitalsVisit] = useState<TriageVisit | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPage = useCallback(
    async (page: number, searchQuery: string, mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setError('You are not signed in.');
        setLoading(false);
        return;
      }

      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await fetchTriages(token, { page, perPage, search: searchQuery });
        setVisits(data.visits);
        setTotalRecords(data.total_records);
        setCurrentPage(data.current_page);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load triage queue.');
        setVisits([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [perPage, token]
  );

  const prevSearchRef = useRef(debouncedSearch);
  const prevPerPageRef = useRef(perPage);

  useEffect(() => {
    const searchChanged = prevSearchRef.current !== debouncedSearch;
    const perPageChanged = prevPerPageRef.current !== perPage;
    prevSearchRef.current = debouncedSearch;
    prevPerPageRef.current = perPage;

    if (searchChanged || perPageChanged) {
      setCurrentPage(1);
      loadPage(1, debouncedSearch);
      return;
    }

    loadPage(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, perPage, loadPage]);

  const onRefresh = useCallback(() => {
    loadPage(currentPage, debouncedSearch, 'refresh');
  }, [currentPage, debouncedSearch, loadPage]);

  const handlePatientPress = useCallback(
    (visit: TriageVisit) => {
      router.push(`/patients/${visit.patient.id}`);
    },
    [router]
  );

  const handleStartPress = useCallback((visit: TriageVisit) => {
    setVitalsVisit(visit);
  }, []);

  const handleCloseVitalsModal = useCallback(() => {
    setVitalsVisit(null);
  }, []);

  const handleSubmitVitals = useCallback(
    async (formData: GeneralVitalsFormValues) => {
      if (!token || !vitalsVisit) {
        throw new Error('You are not signed in.');
      }

      await submitVisitVitals(token, vitalsVisit.id, formData);

      setVisits(prev => prev.filter(v => v.id !== vitalsVisit.id));
      setTotalRecords(prev => Math.max(0, prev - 1));
      setVitalsVisit(null);
    },
    [token, vitalsVisit]
  );

  const showEmpty = !loading && visits.length === 0 && !error;
  const showList = !loading && visits.length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <TriagesToolbar
        search={search}
        onSearchChange={setSearch}
        totalRecords={totalRecords}
        loading={loading && !refreshing}
      />

      {error ? (
        <View
          style={[
            styles.errorCard,
            PatientUI.cardShadowLight,
            { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
          <Pressable onPress={() => loadPage(currentPage, debouncedSearch)} accessibilityRole="button">
            <ThemedText type="linkPrimary">Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {loading && !refreshing ? (
          <ActivityIndicator style={styles.loader} color={Brand.primary} />
        ) : null}

        {showEmpty ? (
          <View
            style={[
              styles.empty,
              PatientUI.cardShadow,
              { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
            ]}>
            <View style={[styles.emptyIcon, { backgroundColor: '#fff7ed' }]}>
              <Ionicons name="medkit-outline" size={36} color="#ea580c" />
            </View>
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              {debouncedSearch ? 'No matches' : 'Triage bay is clear'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
              {debouncedSearch
                ? 'Try another patient name.'
                : 'Walk-ins appear here until vitals are recorded. They then move to the consultation queue.'}
            </ThemedText>
          </View>
        ) : null}

        {showList ? (
          <TriageListView
            visits={visits}
            onPatientPress={handlePatientPress}
            onStartPress={handleStartPress}
          />
        ) : null}
      </ScrollView>

      {showList && totalRecords > perPage ? (
        <PaginationControls
          totalRecords={totalRecords}
          currentPage={currentPage}
          perPage={perPage}
          onPageChange={setCurrentPage}
          disabled={loading || refreshing}
        />
      ) : null}

      <GeneralVitalsModal
        visible={vitalsVisit != null}
        visit={vitalsVisit}
        onClose={handleCloseVitalsModal}
        onSubmit={handleSubmitVitals}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.two,
  },
  loader: {
    marginTop: Spacing.six,
  },
  errorCard: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  empty: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.six,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: Spacing.three,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
  },
  emptyHint: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
