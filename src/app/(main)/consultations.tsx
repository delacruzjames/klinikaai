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

import { ConsultationListView } from '@/components/consultations/consultation-list-view';
import { ConsultationsEmptyState } from '@/components/consultations/consultations-empty-state';
import { ConsultationsSearchBar } from '@/components/consultations/consultations-search-bar';
import { PaginationControls } from '@/components/patients/pagination-controls';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePatientsPerPage } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { fetchConsultations, type Consultation } from '@/services/consultations-api';

export default function ConsultationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useTheme();
  const perPage = usePatientsPerPage();
  const scrollRef = useRef<ScrollView>(null);

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const data = await fetchConsultations(token, {
          page,
          perPage,
          search: searchQuery,
        });
        setConsultations(data.medical_histories);
        setTotalRecords(data.total_records);
        setCurrentPage(data.current_page);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load consultations.');
        setConsultations([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [perPage, token]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, perPage]);

  useEffect(() => {
    loadPage(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, loadPage]);

  const countLabel = loading
    ? 'Loading…'
    : totalRecords === 0
      ? 'No consultations'
      : `${totalRecords} consultation${totalRecords === 1 ? '' : 's'}`;

  const handleConsultationPress = (consultation: Consultation) => {
    if (consultation.patient_id && consultation.id) {
      router.push({
        pathname: '/patients/[id]/consultations/[consultationId]',
        params: {
          id: String(consultation.patient_id),
          consultationId: String(consultation.id),
        },
      });
    }
  };

  const listContent =
    loading && consultations.length === 0 ? (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Brand.primary} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading consultations…
        </ThemedText>
      </View>
    ) : error && consultations.length === 0 ? (
      <View style={styles.centered}>
        <View style={[styles.stateIcon, { backgroundColor: Brand.primaryMuted }]}>
          <Ionicons name="cloud-offline-outline" size={28} color={Brand.primary} />
        </View>
        <ThemedText type="smallBold">Couldn&apos;t load consultations</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
          {error}
        </ThemedText>
        <Pressable
          onPress={() => loadPage(currentPage, debouncedSearch)}
          style={[styles.retryBtn, { backgroundColor: Brand.primary }]}
          accessibilityRole="button">
          <ThemedText style={styles.retryBtnText}>Try again</ThemedText>
        </Pressable>
      </View>
    ) : consultations.length === 0 ? (
      <ConsultationsEmptyState
        subtitle={
          debouncedSearch ? 'Try adjusting your search.' : 'Consultations will appear here.'
        }
      />
    ) : (
      <>
        <ConsultationListView
          consultations={consultations}
          showPatient
          showBranch={false}
          onConsultationPress={handleConsultationPress}
        />
        {totalRecords > perPage ? (
          <PaginationControls
            currentPage={currentPage}
            totalRecords={totalRecords}
            perPage={perPage}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </>
    );

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.scroll, { backgroundColor: theme.backgroundElement }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadPage(currentPage, debouncedSearch, 'refresh')}
          tintColor={Brand.primary}
        />
      }>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.title}>Consultations</ThemedText>
            <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
              <ThemedText type="smallBold" style={styles.badgeText}>
                {countLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        <ConsultationsSearchBar value={search} onChangeText={setSearch} />

        {error && consultations.length > 0 ? (
          <View style={[styles.inlineError, { borderColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="textSecondary">
              {error}
            </ThemedText>
            <Pressable
              onPress={() => loadPage(currentPage, debouncedSearch)}
              accessibilityRole="button">
              <ThemedText type="linkPrimary">Retry</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {listContent}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: Spacing.six,
  },
  shell: {
    width: '100%',
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: PatientUI.radius.sm,
  },
  badgeText: {
    color: Brand.primary,
    fontSize: 12,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
    maxWidth: 280,
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
