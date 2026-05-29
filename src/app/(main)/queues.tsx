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

import { ConsultationSummaryModal } from '@/components/queues/consultation-summary-modal';
import { QueueListView } from '@/components/queues/queue-list-view';
import { QueuesToolbar } from '@/components/queues/queues-toolbar';
import { PaginationControls } from '@/components/patients/pagination-controls';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePatientsPerPage } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import type { ConsultationPrefillResponse } from '@/services/consultation-summary-api';
import {
  fetchQueues,
  hasValidQueueConsultation,
  type QueueVisit,
} from '@/services/queues-api';
import { saveConsultationPrefillForPatient } from '@/utils/consultation-prefill-cache';
import { formatTriageAge } from '@/utils/format-triage';

function matchesSearch(visit: QueueVisit, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    visit.patient.fullname.toLowerCase().includes(q) ||
    (visit.chief_complaint?.toLowerCase().includes(q) ?? false) ||
    formatTriageAge(visit.patient.age).toLowerCase().includes(q)
  );
}

export default function QueuesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useTheme();
  const perPage = usePatientsPerPage();
  const scrollRef = useRef<ScrollView>(null);

  const [queues, setQueues] = useState<QueueVisit[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryVisit, setSummaryVisit] = useState<QueueVisit | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPage = useCallback(
    async (page: number, mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setError('You are not signed in.');
        setLoading(false);
        return;
      }

      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await fetchQueues(token, { page, perPage });
        setQueues(data.queues);
        setTotalRecords(data.total_records);
        setCurrentPage(data.current_page);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load queue.');
        setQueues([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [perPage, token]
  );

  const prevPerPageRef = useRef(perPage);

  useEffect(() => {
    const perPageChanged = prevPerPageRef.current !== perPage;
    prevPerPageRef.current = perPage;

    if (perPageChanged) {
      setCurrentPage(1);
      loadPage(1);
      return;
    }

    loadPage(currentPage);
  }, [currentPage, perPage, loadPage]);

  const onRefresh = useCallback(() => {
    loadPage(currentPage, 'refresh');
  }, [currentPage, loadPage]);

  const filteredQueues = useMemo(
    () => queues.filter(visit => matchesSearch(visit, debouncedSearch)),
    [queues, debouncedSearch]
  );

  const handlePatientPress = useCallback(
    (visit: QueueVisit) => {
      router.push(`/patients/${visit.patient.id}`);
    },
    [router]
  );

  const handleConsultationPress = useCallback((visit: QueueVisit) => {
    setSummaryVisit(visit);
  }, []);

  const handleCloseSummary = useCallback(() => {
    setSummaryVisit(null);
  }, []);

  const handleProceed = useCallback(
    (prefill: ConsultationPrefillResponse | null) => {
      if (!summaryVisit) return;

      const visit = summaryVisit;
      const isEdit = hasValidQueueConsultation(visit);

      if (!isEdit && prefill?.ai) {
        saveConsultationPrefillForPatient(visit.patient.id, prefill.ai);
      }

      setSummaryVisit(null);

      if (isEdit && visit.consultation_id) {
        router.push({
          pathname: '/patients/[id]',
          params: {
            id: String(visit.patient.id),
            tab: 'consultation-form',
            consultationId: String(visit.consultation_id),
          },
        });
      } else {
        router.push({
          pathname: '/patients/[id]',
          params: {
            id: String(visit.patient.id),
            tab: 'consultation-form',
          },
        });
      }
    },
    [router, summaryVisit]
  );

  const showEmpty =
    !loading && filteredQueues.length === 0 && !error;
  const showList = !loading && filteredQueues.length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <QueuesToolbar
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
          <Pressable onPress={() => loadPage(currentPage)} accessibilityRole="button">
            <ThemedText type="linkPrimary">Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
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
            <View style={[styles.emptyIcon, { backgroundColor: Brand.primaryMuted }]}>
              <Ionicons name="hourglass-outline" size={36} color={Brand.primary} />
            </View>
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              {debouncedSearch ? 'No matches' : 'Queue is clear'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
              {debouncedSearch
                ? 'Try a different name or chief complaint.'
                : 'Patients who complete triage will appear here for consultation.'}
            </ThemedText>
          </View>
        ) : null}

        {showList ? (
          <QueueListView
            visits={filteredQueues}
            onPatientPress={handlePatientPress}
            onConsultationPress={handleConsultationPress}
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

      {summaryVisit ? (
        <ConsultationSummaryModal
          visible={summaryVisit != null}
          patientId={summaryVisit.patient.id}
          patientName={summaryVisit.patient.fullname}
          visitId={summaryVisit.id}
          token={token}
          isEditMode={hasValidQueueConsultation(summaryVisit)}
          onClose={handleCloseSummary}
          onProceed={handleProceed}
        />
      ) : null}
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
