import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  TriageArrivalFooter,
  TriageArrivalSection,
} from '@/components/triages/triage-arrival-section';
import { TriageListView } from '@/components/triages/triage-list-view';
import { TriageStatCards } from '@/components/triages/triage-stat-cards';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePatientsPerPage } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { fetchQueues } from '@/services/queues-api';
import { fetchTriages, submitVisitVitals, type TriageVisit } from '@/services/triages-api';
import { computeAverageWaitMinutes, isToday } from '@/utils/format-triage';

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
  const [readyCount, setReadyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vitalsVisit, setVitalsVisit] = useState<TriageVisit | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadReadyCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchQueues(token, { page: 1, perPage: 1 });
      setReadyCount(data.total_records);
    } catch {
      setReadyCount(0);
    }
  }, [token]);

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
        const [data] = await Promise.all([
          fetchTriages(token, { page, perPage, search: searchQuery }),
          loadReadyCount(),
        ]);
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
    [loadReadyCount, perPage, token]
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
      setReadyCount(prev => prev + 1);
      setVitalsVisit(null);
    },
    [token, vitalsVisit]
  );

  const averageWaitMinutes = useMemo(() => computeAverageWaitMinutes(visits), [visits]);
  const patientsToday = useMemo(
    () => visits.filter(visit => isToday(visit.walked_in_at)).length + readyCount,
    [readyCount, visits]
  );
  const startIndex = (currentPage - 1) * perPage;

  const showEmpty = !loading && visits.length === 0 && !error;
  const showList = !loading && visits.length > 0;

  const queueContent = loading && !refreshing ? (
    <ActivityIndicator style={styles.loader} color={Brand.primary} />
  ) : showEmpty ? (
    <View style={styles.empty}>
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
  ) : showList ? (
    <TriageListView
      visits={visits}
      startIndex={startIndex}
      onPatientPress={handlePatientPress}
      onStartPress={handleStartPress}
    />
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
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
        <TriageStatCards
          waitingCount={totalRecords}
          readyCount={readyCount}
          averageWaitMinutes={averageWaitMinutes}
          patientsToday={patientsToday}
          loading={loading && !refreshing}
        />

        <View style={styles.mainColumn}>
          <TriageArrivalSection
            search={search}
            onSearchChange={setSearch}
            footer={<TriageArrivalFooter />}>
            {queueContent}
          </TriageArrivalSection>

          {showList && totalRecords > perPage ? (
            <View style={styles.paginationWrap}>
              <PaginationControls
                totalRecords={totalRecords}
                currentPage={currentPage}
                perPage={perPage}
                onPageChange={setCurrentPage}
                disabled={loading || refreshing}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

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
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  mainColumn: {
    gap: Spacing.two,
  },
  paginationWrap: {
    marginHorizontal: Spacing.four,
  },
  loader: {
    marginVertical: Spacing.six,
  },
  errorCard: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  empty: {
    padding: Spacing.six,
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
