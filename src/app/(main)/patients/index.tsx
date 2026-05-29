import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PaginationControls } from '@/components/patients/pagination-controls';
import { PatientListView } from '@/components/patients/patient-list-view';
import { PatientsToolbar } from '@/components/patients/patients-toolbar';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePatientsPerPage } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { fetchPatients, type Patient } from '@/services/patients-api';

export default function PatientsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useTheme();
  const perPage = usePatientsPerPage();
  const scrollRef = useRef<ScrollView>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const prevSearchRef = useRef(debouncedSearch);
  const prevPerPageRef = useRef(perPage);
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
        const data = await fetchPatients(token, { page, perPage, search: searchQuery });
        setPatients(data.patients);
        setTotalRecords(data.total_records);
        setCurrentPage(data.current_page);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patients.');
        setPatients([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [perPage, token]
  );

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
    (patient: Patient) => {
      router.push(`/patients/${patient.id}`);
    },
    [router]
  );

  const handleAddPatient = useCallback(() => {
    Alert.alert('Add patient', 'Registration will be available soon.');
  }, []);

  const showEmpty = !loading && patients.length === 0 && !error;
  const showList = !loading && patients.length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundElement }]}>
      <PatientsToolbar
        search={search}
        onSearchChange={setSearch}
        totalRecords={totalRecords}
        loading={loading && !refreshing}
        onAddPatient={handleAddPatient}
      />

      {error ? (
        <View style={[styles.errorCard, { backgroundColor: theme.background }]}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled">
        {loading && !refreshing ? (
          <ActivityIndicator style={styles.loader} color={Brand.primary} />
        ) : null}

        {showEmpty ? (
          <View style={[styles.empty, { backgroundColor: theme.background }]}>
            <View style={[styles.emptyIcon, { backgroundColor: Brand.primaryMuted }]}>
              <Ionicons name="people-outline" size={32} color={Brand.primary} />
            </View>
            <ThemedText type="smallBold">
              {debouncedSearch ? 'No matches' : 'No patients yet'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
              {debouncedSearch
                ? 'Try a different search term.'
                : 'Tap + to add your first patient.'}
            </ThemedText>
          </View>
        ) : null}

        {showList ? (
          <PatientListView patients={patients} onPatientPress={handlePatientPress} />
        ) : null}
      </ScrollView>

      {showList ? (
        <PaginationControls
          totalRecords={totalRecords}
          currentPage={currentPage}
          perPage={perPage}
          onPageChange={setCurrentPage}
          disabled={loading || refreshing}
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
    borderRadius: 12,
    gap: Spacing.two,
  },
  empty: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.five,
    borderRadius: 16,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyHint: {
    textAlign: 'center',
    maxWidth: 240,
  },
});
