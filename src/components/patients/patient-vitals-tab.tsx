import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import {
  MAX_VITAL_COLUMNS,
  VITAL_ROWS,
  type VitalRowDef,
  type VitalRowKey,
} from '@/constants/vitals-rows';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { fetchPatientVitals, type Vital } from '@/services/patients-api';
import {
  formatVitalDate,
  formatVitalDateShort,
  formatVitalDisplay,
  padVitalColumns,
  sortVitalsNewestFirst,
} from '@/utils/format-vitals';

type PatientVitalsTabProps = {
  patientId: number;
  isActive: boolean;
};

const LABEL_COL_WIDTH = 176;
const VALUE_COL_WIDTH = 128;

const SUMMARY_KEYS: VitalRowKey[] = ['heart_rate', 'blood_pressure', 'spo2', 'temperature_c'];

const VITAL_GROUPS: { title: string; keys: VitalRowKey[] }[] = [
  {
    title: 'Body measurements',
    keys: ['height_cm', 'weight_kg', 'bmi', 'body_surface_area_m2'],
  },
  {
    title: 'Vital signs',
    keys: ['heart_rate', 'blood_pressure', 'spo2', 'respiratory_rate', 'temperature_c'],
  },
  { title: 'Glucose', keys: ['cbg_mg_dl'] },
];

const rowByKey = Object.fromEntries(VITAL_ROWS.map(row => [row.key, row])) as Record<
  VitalRowKey,
  VitalRowDef
>;

export function PatientVitalsTab({ patientId, isActive }: PatientVitalsTabProps) {
  const { token } = useAuth();
  const theme = useTheme();
  const isTablet = useBreakpoint() !== 'mobile';

  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const loadVitals = useCallback(
    async (mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setError('You are not signed in.');
        return;
      }

      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await fetchPatientVitals(token, patientId);
        setVitals(data);
        setSelectedIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vitals.');
        setVitals([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId, token]
  );

  useEffect(() => {
    if (isActive) loadVitals();
  }, [isActive, loadVitals]);

  const sorted = useMemo(() => sortVitalsNewestFirst(vitals), [vitals]);
  const columns = useMemo(() => padVitalColumns(sorted, MAX_VITAL_COLUMNS), [sorted]);
  const selectedVital = columns[selectedIndex];
  const recordCount = sorted.length;

  const handleAdd = () => {
    Alert.alert('Add vitals', 'Recording vitals will be available soon.');
  };

  const handleEdit = () => {
    if (!selectedVital) return;
    Alert.alert('Edit vitals', 'Editing vitals will be available soon.');
  };

  if (loading && vitals.length === 0) {
    return (
      <VitalsPanel>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <ThemedText type="small" themeColor="textSecondary">
            Loading vitals…
          </ThemedText>
        </View>
      </VitalsPanel>
    );
  }

  if (error && vitals.length === 0) {
    return (
      <VitalsPanel>
        <View style={[styles.centered, styles.errorBox]}>
          <View style={[styles.stateIcon, { backgroundColor: Brand.primaryMuted }]}>
            <Ionicons name="cloud-offline-outline" size={28} color={Brand.primary} />
          </View>
          <ThemedText type="smallBold">Couldn&apos;t load vitals</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable
            onPress={() => loadVitals()}
            style={[styles.retryBtn, { backgroundColor: Brand.primary }]}
            accessibilityRole="button">
            <ThemedText style={styles.retryBtnText}>Try again</ThemedText>
          </Pressable>
        </View>
      </VitalsPanel>
    );
  }

  const headerActions = (
    <VitalsHeaderActions
      refreshing={refreshing}
      loading={loading}
      onRefresh={() => loadVitals('refresh')}
      onAdd={handleAdd}
    />
  );

  if (sorted.length === 0) {
    return (
      <VitalsPanel>
        <VitalsHeader
          recordCount={0}
          actions={headerActions}
        />
        <View style={styles.emptyState}>
          <View style={[styles.stateIcon, { backgroundColor: Brand.primaryMuted }]}>
            <Ionicons name="pulse-outline" size={32} color={Brand.primary} />
          </View>
          <ThemedText type="smallBold" style={styles.emptyTitle}>
            No vitals yet
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
            Record height, weight, blood pressure, and other measurements for this patient.
          </ThemedText>
          <Pressable
            onPress={handleAdd}
            style={[styles.primaryBtn, { backgroundColor: Brand.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Record vitals">
            <Ionicons name="add" size={20} color="#ffffff" />
            <ThemedText style={styles.primaryBtnText}>Record vitals</ThemedText>
          </Pressable>
        </View>
      </VitalsPanel>
    );
  }

  if (isTablet) {
    return (
      <VitalsPanel>
        <VitalsHeader recordCount={recordCount} actions={headerActions} />
        <VitalsTabletTable
          columns={columns}
          onEdit={handleEdit}
        />
      </VitalsPanel>
    );
  }

  return (
    <VitalsPanel>
      <VitalsHeader recordCount={recordCount} actions={headerActions} />
      <VitalsMobileView
        columns={columns}
        selectedIndex={selectedIndex}
        selectedVital={selectedVital}
        onSelectIndex={setSelectedIndex}
        onEdit={handleEdit}
      />
    </VitalsPanel>
  );
}

function VitalsPanel({ children }: { children: ReactNode }) {
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

function VitalsHeader({
  recordCount,
  actions,
}: {
  recordCount: number;
  actions: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText style={styles.title}>General Vitals</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {recordCount === 0
            ? 'Patient measurements'
            : `${recordCount} recording${recordCount === 1 ? '' : 's'} · showing latest ${Math.min(recordCount, MAX_VITAL_COLUMNS)}`}
        </ThemedText>
      </View>
      {actions}
    </View>
  );
}

function VitalsHeaderActions({
  refreshing,
  loading,
  onRefresh,
  onAdd,
}: {
  refreshing: boolean;
  loading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.headerActions}>
      <Pressable
        onPress={onRefresh}
        disabled={loading || refreshing}
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Refresh vitals">
        {refreshing ? (
          <ActivityIndicator size="small" color={Brand.primary} />
        ) : (
          <Ionicons name="refresh-outline" size={20} color={theme.text} />
        )}
      </Pressable>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: Brand.primary },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add vitals">
        <Ionicons name="add" size={22} color="#ffffff" />
      </Pressable>
    </View>
  );
}

function VitalsSummaryCard({
  row,
  vital,
  compact,
}: {
  row: VitalRowDef;
  vital: Vital | undefined;
  compact?: boolean;
}) {
  const theme = useTheme();
  const display = formatVitalDisplay(vital, row.key);
  const isEmpty = !display;

  return (
    <View
      style={[
        styles.summaryCard,
        PatientUI.cardShadowLight,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          minHeight: compact ? 88 : 96,
        },
      ]}>
      <View style={[styles.summaryIcon, { backgroundColor: `${row.color}20` }]}>
        <Ionicons name={row.icon} size={compact ? 18 : 20} color={row.color} />
      </View>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        numberOfLines={2}
        style={styles.summaryLabel}>
        {row.label}
      </ThemedText>
      {isEmpty ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.summaryEmpty}>
          —
        </ThemedText>
      ) : (
        <View style={styles.summaryValueRow}>
          <ThemedText style={[styles.summaryValue, compact && styles.summaryValueCompact]}>
            {display.primary}
          </ThemedText>
          {display.unit ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.summaryUnit}>
              {display.unit}
            </ThemedText>
          ) : null}
        </View>
      )}
    </View>
  );
}

function VitalsMobileView({
  columns,
  selectedIndex,
  selectedVital,
  onSelectIndex,
  onEdit,
}: {
  columns: (Vital | undefined)[];
  selectedIndex: number;
  selectedVital: Vital | undefined;
  onSelectIndex: (index: number) => void;
  onEdit: () => void;
}) {
  const theme = useTheme();
  const isLatest = selectedIndex === 0;

  return (
    <>
      {isLatest && selectedVital ? (
        <View style={styles.summaryGrid}>
          {SUMMARY_KEYS.map(key => (
            <View key={key} style={styles.summaryGridItem}>
              <VitalsSummaryCard row={rowByKey[key]} vital={selectedVital} compact />
            </View>
          ))}
        </View>
      ) : null}

      <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Visit date
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePills}>
        {columns.map((col, index) => {
          if (!col) return null;
          const isSelected = index === selectedIndex;
          return (
            <Pressable
              key={col.id}
              onPress={() => onSelectIndex(index)}
              style={[
                styles.datePill,
                {
                  backgroundColor: isSelected ? Brand.primary : theme.backgroundElement,
                  borderColor: isSelected ? Brand.primary : theme.backgroundSelected,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}>
              {index === 0 ? (
                <View
                  style={[
                    styles.latestBadge,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : Brand.primaryMuted },
                  ]}>
                  <ThemedText
                    style={[
                      styles.latestBadgeText,
                      { color: isSelected ? '#ffffff' : Brand.primary },
                    ]}>
                    Latest
                  </ThemedText>
                </View>
              ) : null}
              <ThemedText
                type="smallBold"
                style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                {formatVitalDateShort(col.recorded_at)}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedVital ? (
        <View
          style={[
            styles.selectedBanner,
            { backgroundColor: Brand.primaryMuted, borderColor: `${Brand.primary}30` },
          ]}>
          <View style={styles.selectedBannerText}>
            <ThemedText type="smallBold" style={{ color: Brand.primary }}>
              {isLatest ? 'Latest reading' : 'Selected reading'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatVitalDate(selectedVital.recorded_at)}
            </ThemedText>
          </View>
          {isLatest ? (
            <Pressable
              onPress={onEdit}
              style={[styles.editChip, { backgroundColor: theme.background }]}
              accessibilityRole="button"
              accessibilityLabel="Edit vitals">
              <Ionicons name="create-outline" size={16} color="#d97706" />
              <ThemedText type="small" style={styles.editChipText}>
                Edit
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {VITAL_GROUPS.map(group => (
        <View key={group.title} style={styles.group}>
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            {group.title}
          </ThemedText>
          <View
            style={[
              styles.metricList,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            ]}>
            {group.keys.map((key, index) => {
              const row = rowByKey[key];
              const display = formatVitalDisplay(selectedVital, key);
              const isEmpty = !display;
              const isLast = index === group.keys.length - 1;

              return (
                <View
                  key={key}
                  style={[
                    styles.metricRow,
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.backgroundSelected,
                    },
                  ]}>
                  <View style={[styles.metricIcon, { backgroundColor: `${row.color}18` }]}>
                    <Ionicons name={row.icon} size={20} color={row.color} />
                  </View>
                  <View style={styles.metricContent}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {row.label}
                    </ThemedText>
                    {isEmpty ? (
                      <ThemedText type="small" themeColor="textSecondary" style={styles.metricEmpty}>
                        Not recorded
                      </ThemedText>
                    ) : (
                      <View style={styles.metricValueRow}>
                        <ThemedText style={styles.metricValue}>{display.primary}</ThemedText>
                        {display.unit ? (
                          <ThemedText type="small" themeColor="textSecondary">
                            {display.unit}
                          </ThemedText>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </>
  );
}

function VitalsTabletTable({
  columns,
  onEdit,
}: {
  columns: (Vital | undefined)[];
  onEdit: () => void;
}) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const latestColumnBg = isDark ? `${Brand.primary}28` : Brand.primaryMuted;

  return (
    <View style={[styles.tableWrap, { borderColor: theme.backgroundSelected }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.tableRow, styles.tableHeadRow]}>
            <View style={[styles.labelCell, styles.headLabelCell]}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.colHeader}>
                Measurement
              </ThemedText>
            </View>
            {columns.map((col, colIndex) => {
              const isLatest = colIndex === 0;
              return (
                <View
                  key={col?.id ?? `empty-${colIndex}`}
                  style={[
                    styles.valueCell,
                    styles.headValueCell,
                    isLatest && styles.latestColumn,
                    isLatest && { backgroundColor: latestColumnBg },
                  ]}>
                  {col ? (
                    <View style={styles.dateHead}>
                      <View style={styles.dateHeadTextWrap}>
                        {isLatest ? (
                          <View style={[styles.latestPill, { backgroundColor: Brand.primary }]}>
                            <ThemedText style={styles.latestPillText}>Latest</ThemedText>
                          </View>
                        ) : null}
                        <ThemedText
                          type="smallBold"
                          themeColor={isLatest ? undefined : 'textSecondary'}
                          style={isLatest ? [styles.dateHeadText, styles.dateHeadTextActive] : styles.dateHeadText}
                          numberOfLines={2}>
                          {formatVitalDate(col.recorded_at)}
                        </ThemedText>
                      </View>
                      {isLatest ? (
                        <Pressable
                          onPress={onEdit}
                          hitSlop={8}
                          style={[styles.editIconBtn, { backgroundColor: theme.background }]}
                          accessibilityRole="button"
                          accessibilityLabel="Edit latest vitals">
                          <Ionicons name="create-outline" size={16} color="#d97706" />
                        </Pressable>
                      ) : null}
                    </View>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">
                      —
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </View>

          {VITAL_ROWS.map((row, rowIndex) => (
            <View
              key={row.key}
              style={[
                styles.tableRow,
                rowIndex % 2 === 1 && { backgroundColor: `${theme.backgroundElement}80` },
                { borderTopColor: theme.backgroundSelected },
              ]}>
              <View style={styles.labelCell}>
                <View style={[styles.tableRowIcon, { backgroundColor: `${row.color}18` }]}>
                  <Ionicons name={row.icon} size={18} color={row.color} />
                </View>
                <ThemedText type="small" style={styles.rowLabel} numberOfLines={2}>
                  {row.label}
                </ThemedText>
              </View>
              {columns.map((col, colIndex) => {
                const isLatest = colIndex === 0;
                const display = formatVitalDisplay(col, row.key);
                const isEmpty = !display;
                return (
                  <View
                    key={`${row.key}-${col?.id ?? colIndex}`}
                    style={[
                      styles.valueCell,
                      isLatest && styles.latestColumn,
                      isLatest && { backgroundColor: latestColumnBg },
                    ]}>
                    {isEmpty ? (
                      <ThemedText type="small" themeColor="textSecondary" style={styles.cellEmpty}>
                        —
                      </ThemedText>
                    ) : (
                      <View>
                        <ThemedText
                          type="smallBold"
                          style={isLatest ? styles.cellPrimaryActive : undefined}
                          numberOfLines={1}>
                          {display.primary}
                        </ThemedText>
                        {display.unit ? (
                          <ThemedText type="small" themeColor="textSecondary" style={styles.cellUnit}>
                            {display.unit}
                          </ThemedText>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  errorBox: {
    minHeight: 200,
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
    gap: Spacing.three,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 17,
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: PatientUI.radius.md,
    marginTop: Spacing.two,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
    marginBottom: Spacing.one,
  },
  summaryGridItem: {
    width: '50%',
    padding: Spacing.one,
  },
  summaryCard: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryValueCompact: {
    fontSize: 20,
  },
  summaryUnit: {
    fontSize: 12,
  },
  summaryEmpty: {
    fontSize: 18,
    opacity: 0.5,
  },
  datePills: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  datePill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    minWidth: 96,
    gap: 4,
  },
  latestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  latestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  datePillText: {
    fontSize: 14,
    color: Brand.primary,
    fontWeight: '600',
  },
  datePillTextActive: {
    color: '#ffffff',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  selectedBannerText: {
    flex: 1,
    gap: 2,
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: PatientUI.radius.sm,
  },
  editChipText: {
    color: '#d97706',
    fontWeight: '600',
    fontSize: 13,
  },
  group: {
    marginTop: Spacing.one,
  },
  metricList: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
    gap: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metricEmpty: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  tableWrap: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tableHeadRow: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  labelCell: {
    width: LABEL_COL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  headLabelCell: {
    minHeight: 64,
    justifyContent: 'center',
  },
  colHeader: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  valueCell: {
    width: VALUE_COL_WIDTH,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
  },
  headValueCell: {
    minHeight: 64,
  },
  latestColumn: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: `${Brand.primary}25`,
  },
  dateHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  dateHeadTextWrap: {
    flex: 1,
    gap: 6,
  },
  latestPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  latestPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dateHeadText: {
    fontSize: 12,
    lineHeight: 16,
  },
  dateHeadTextActive: {
    color: Brand.primary,
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPrimaryActive: {
    fontSize: 16,
  },
  cellUnit: {
    fontSize: 11,
    marginTop: 2,
  },
  cellEmpty: {
    opacity: 0.5,
  },
});
