import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GrowthLineChart } from '@/components/patients/growth-line-chart';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import {
  fetchPatientGrowthChart,
  type GrowthChartDataPoint,
  type PatientGrowthChartResponse,
} from '@/services/growth-chart-api';
import {
  apiSeriesToChartPoints,
  defaultWhoReference,
  formatAgeLabel,
  formatGrowthDate,
  formatGrowthDateTime,
  formatGrowthDob,
  getNearestPercentile,
  normalizePatientSex,
  toGrowthNumber,
} from '@/utils/growth-chart';

type PatientGrowthTabProps = {
  patientId: number;
  isActive: boolean;
};

export function PatientGrowthTab({ patientId, isActive }: PatientGrowthTabProps) {
  const { token } = useAuth();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const [data, setData] = useState<PatientGrowthChartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGrowthChart = useCallback(
    async (mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setError('You are not signed in.');
        return;
      }

      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await fetchPatientGrowthChart(token, patientId);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load growth chart.');
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId, token]
  );

  useEffect(() => {
    if (isActive) loadGrowthChart();
  }, [isActive, loadGrowthChart]);

  const sex = normalizePatientSex(data?.patient.gender);
  const summary = data?.summary;
  const patientAgeMonths = data?.patient.current_age_months ?? summary?.latest_age_months ?? 0;
  const hasMeasurements = (summary?.total_measurements ?? 0) > 0;
  /** Show WHO 0–24m reference curves whenever we have vitals (like web). */
  const showWhoReference = hasMeasurements;
  const showWhoAgeNote = patientAgeMonths > 24;

  const latestHeight = toGrowthNumber(summary?.latest_height_cm);
  const latestWeight = toGrowthNumber(summary?.latest_weight_kg);
  const latestBmi = toGrowthNumber(summary?.latest_bmi);
  const latestAgeMonths = summary?.latest_age_months ?? patientAgeMonths;

  const heightPercentile =
    showWhoReference && latestHeight != null
      ? getNearestPercentile(latestHeight, defaultWhoReference[sex].height, latestAgeMonths)
      : null;
  const weightPercentile =
    showWhoReference && latestWeight != null
      ? getNearestPercentile(latestWeight, defaultWhoReference[sex].weight, latestAgeMonths)
      : null;
  const bmiPercentile =
    showWhoReference && latestBmi != null
      ? getNearestPercentile(latestBmi, defaultWhoReference[sex].bmi, latestAgeMonths)
      : null;

  const historyPoints = useMemo(
    () => (data?.data_points ? [...data.data_points].reverse() : []),
    [data?.data_points]
  );

  if (loading && !data) {
    return (
      <GrowthPanel>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <ThemedText type="small" themeColor="textSecondary">
            Loading growth chart…
          </ThemedText>
        </View>
      </GrowthPanel>
    );
  }

  if (error && !data) {
    return (
      <GrowthPanel>
        <View style={[styles.centered, styles.errorBox]}>
          <View style={[styles.stateIcon, { backgroundColor: Brand.primaryMuted }]}>
            <Ionicons name="cloud-offline-outline" size={28} color={Brand.primary} />
          </View>
          <ThemedText type="smallBold">Couldn&apos;t load growth chart</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable
            onPress={() => loadGrowthChart()}
            style={[styles.primaryBtn, { backgroundColor: Brand.primary }]}
            accessibilityRole="button">
            <ThemedText style={styles.primaryBtnText}>Try again</ThemedText>
          </Pressable>
        </View>
      </GrowthPanel>
    );
  }

  if (!data) return null;

  return (
    <GrowthPanel>
      <GrowthHeader
        data={data}
        sex={sex}
        refreshing={refreshing}
        loading={loading}
        onRefresh={() => loadGrowthChart('refresh')}
      />

      <SummaryGrid isMobile={isMobile}>
        <SummaryCardWrap isMobile={isMobile}>
          <SummaryCard
            label="Latest height"
            value={latestHeight != null ? `${latestHeight}` : '—'}
            unit={latestHeight != null ? 'cm' : undefined}
            subtitle={heightPercentile ? `~${heightPercentile} percentile` : undefined}
            accent="#3b82f6"
          />
        </SummaryCardWrap>
        <SummaryCardWrap isMobile={isMobile}>
          <SummaryCard
            label="Latest weight"
            value={latestWeight != null ? `${latestWeight}` : '—'}
            unit={latestWeight != null ? 'kg' : undefined}
            subtitle={weightPercentile ? `~${weightPercentile} percentile` : undefined}
            accent="#64748b"
          />
        </SummaryCardWrap>
        <SummaryCardWrap isMobile={isMobile}>
          <SummaryCard
            label="Latest BMI"
            value={latestBmi != null ? latestBmi.toFixed(2) : '—'}
            subtitle={bmiPercentile ? `~${bmiPercentile} percentile` : undefined}
            accent="#8b5cf6"
          />
        </SummaryCardWrap>
        <SummaryCardWrap isMobile={isMobile}>
          <SummaryCard
            label="Total measurements"
            value={String(summary?.total_measurements ?? 0)}
            subtitle={
              summary?.first_recorded_at && summary?.last_recorded_at
                ? `${formatGrowthDate(summary.first_recorded_at)} – ${formatGrowthDate(summary.last_recorded_at)}`
                : undefined
            }
            accent={Brand.primary}
          />
        </SummaryCardWrap>
      </SummaryGrid>

      {!hasMeasurements ? (
        <View style={[styles.notice, { backgroundColor: Brand.primaryMuted, borderColor: `${Brand.primary}40` }]}>
          <Ionicons name="information-circle-outline" size={20} color={Brand.primary} />
          <ThemedText type="small" style={[styles.noticeText, { color: Brand.primary }]}>
            Record height and weight in the Vitals tab to plot growth over time.
          </ThemedText>
        </View>
      ) : (
        <>
          {showWhoAgeNote ? (
            <View style={[styles.warning, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
              <ThemedText type="small" style={styles.warningText}>
                WHO reference curves are shown for ages 0–24 months. Patient measurements beyond 24
                months still appear on the chart.
              </ThemedText>
            </View>
          ) : null}

          <GrowthChartsRow data={data} sex={sex} showWhoReference={showWhoReference} />

          <MeasurementHistory points={historyPoints} isMobile={isMobile} />
        </>
      )}
    </GrowthPanel>
  );
}

function GrowthPanel({ children }: { children: ReactNode }) {
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

function GrowthHeader({
  data,
  sex,
  refreshing,
  loading,
  onRefresh,
}: {
  data: PatientGrowthChartResponse;
  sex: ReturnType<typeof normalizePatientSex>;
  refreshing: boolean;
  loading: boolean;
  onRefresh: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText style={styles.title}>Growth Chart</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {data.patient.fullname} · {sex} · DOB {formatGrowthDob(data.patient.date_of_birth)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Current age: {formatAgeLabel(data.patient.current_age_months)} (
          {data.patient.current_age_years.toFixed(1)} years)
        </ThemedText>
        {data.summary.last_recorded_at ? (
          <ThemedText type="small" themeColor="textSecondary">
            Last recorded {formatGrowthDateTime(data.summary.last_recorded_at)}
          </ThemedText>
        ) : null}
      </View>
      <Pressable
        onPress={onRefresh}
        disabled={loading || refreshing}
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Refresh growth chart">
        {refreshing ? (
          <ActivityIndicator size="small" color={Brand.primary} />
        ) : (
          <Ionicons name="refresh-outline" size={20} color={theme.text} />
        )}
      </Pressable>
    </View>
  );
}

function SummaryGrid({ children, isMobile }: { children: ReactNode; isMobile: boolean }) {
  return (
    <View style={[styles.summaryGrid, isMobile ? styles.summaryGridMobile : styles.summaryGridWide]}>
      {children}
    </View>
  );
}

function SummaryCardWrap({ children, isMobile }: { children: ReactNode; isMobile: boolean }) {
  return (
    <View style={isMobile ? styles.summaryCardMobile : styles.summaryCardWide}>{children}</View>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  subtitle?: string;
  accent: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        PatientUI.cardShadowLight,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <View style={[styles.summaryAccent, { backgroundColor: accent }]} />
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <View style={styles.summaryValueRow}>
        <ThemedText style={styles.summaryValue}>{value}</ThemedText>
        {unit ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.summaryUnit}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      {subtitle ? (
        <ThemedText type="small" style={styles.summarySubtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

function GrowthChartsRow({
  data,
  sex,
  showWhoReference,
}: {
  data: PatientGrowthChartResponse;
  sex: ReturnType<typeof normalizePatientSex>;
  showWhoReference: boolean;
}) {
  const charts: { kind: 'height' | 'weight' | 'bmi' }[] = [
    { kind: 'height' },
    { kind: 'weight' },
    { kind: 'bmi' },
  ];

  const seriesByKind = {
    height: apiSeriesToChartPoints(data.series.height_for_age),
    weight: apiSeriesToChartPoints(data.series.weight_for_age),
    bmi: apiSeriesToChartPoints(data.series.bmi_for_age),
  };

  return (
    <View style={styles.chartsStack}>
      {charts.map(({ kind }) => (
        <ChartCard key={kind}>
          <GrowthLineChart
            kind={kind}
            patientPoints={seriesByKind[kind]}
            sex={sex}
            showWhoReference={showWhoReference}
          />
        </ChartCard>
      ))}
    </View>
  );
}

function ChartCard({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.chartCard,
        PatientUI.cardShadowLight,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      {children}
    </View>
  );
}

function MeasurementHistory({
  points,
  isMobile,
}: {
  points: GrowthChartDataPoint[];
  isMobile: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <ThemedText type="smallBold">Measurement history</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.historyHint}>
          Growth rate columns show change per month since the previous visit.
        </ThemedText>
      </View>

      {isMobile ? (
        <View style={styles.historyCards}>
          {points.map(point => (
            <View
              key={point.id}
              style={[
                styles.historyCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
              ]}>
              <View style={styles.historyCardHeader}>
                <ThemedText type="smallBold">{formatGrowthDateTime(point.recorded_at)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatAgeLabel(point.age_months)}
                </ThemedText>
              </View>
              <View style={styles.historyMetrics}>
                <HistoryMetric label="Height" value={formatMetric(point.height_cm, 'cm')} />
                <HistoryMetric label="Weight" value={formatMetric(point.weight_kg, 'kg')} />
                <HistoryMetric
                  label="BMI"
                  value={toGrowthNumber(point.bmi)?.toFixed(2) ?? '—'}
                />
              </View>
              {(point.height_velocity_cm_per_month != null ||
                point.weight_velocity_kg_per_month != null ||
                point.bmi_change_per_month != null) && (
                <View style={[styles.velocityRow, { borderTopColor: theme.backgroundSelected }]}>
                  <HistoryMetric
                    label="Height /mo"
                    value={
                      point.height_velocity_cm_per_month != null
                        ? `${Number(point.height_velocity_cm_per_month).toFixed(2)} cm`
                        : '—'
                    }
                    compact
                  />
                  <HistoryMetric
                    label="Weight /mo"
                    value={
                      point.weight_velocity_kg_per_month != null
                        ? `${Number(point.weight_velocity_kg_per_month).toFixed(2)} kg`
                        : '—'
                    }
                    compact
                  />
                  <HistoryMetric
                    label="BMI /mo"
                    value={
                      point.bmi_change_per_month != null
                        ? Number(point.bmi_change_per_month).toFixed(2)
                        : '—'
                    }
                    compact
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.tableWrap, { borderColor: theme.backgroundSelected }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.tableRow, { borderBottomColor: theme.backgroundSelected }]}>
                {['Date', 'Age', 'Height', 'Weight', 'BMI', 'Height /mo', 'Weight /mo', 'BMI /mo'].map(
                  col => (
                    <View key={col} style={styles.tableHeadCell}>
                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.tableHeadText}>
                        {col}
                      </ThemedText>
                    </View>
                  )
                )}
              </View>
              {points.map((point, index) => (
                <View
                  key={point.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 && { backgroundColor: `${theme.backgroundElement}80` },
                    { borderBottomColor: theme.backgroundSelected },
                  ]}>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">{formatGrowthDateTime(point.recorded_at)}</ThemedText>
                  </View>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">{formatAgeLabel(point.age_months)}</ThemedText>
                  </View>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">{formatMetric(point.height_cm, 'cm')}</ThemedText>
                  </View>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">{formatMetric(point.weight_kg, 'kg')}</ThemedText>
                  </View>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">
                      {toGrowthNumber(point.bmi)?.toFixed(2) ?? '—'}
                    </ThemedText>
                  </View>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">
                      {point.height_velocity_cm_per_month != null
                        ? `${Number(point.height_velocity_cm_per_month).toFixed(2)} cm`
                        : '—'}
                    </ThemedText>
                  </View>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">
                      {point.weight_velocity_kg_per_month != null
                        ? `${Number(point.weight_velocity_kg_per_month).toFixed(2)} kg`
                        : '—'}
                    </ThemedText>
                  </View>
                  <View style={styles.tableCell}>
                    <ThemedText type="small">
                      {point.bmi_change_per_month != null
                        ? Number(point.bmi_change_per_month).toFixed(2)
                        : '—'}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function HistoryMetric({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.historyMetric, compact && styles.historyMetricCompact]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.historyMetricLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={compact ? styles.historyMetricValueCompact : undefined}>
        {value}
      </ThemedText>
    </View>
  );
}

function formatMetric(value: string | number | null, unit: string): string {
  const num = toGrowthNumber(value);
  return num != null ? `${num} ${unit}` : '—';
}

const TABLE_COL_WIDTH = 112;

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
  primaryBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: PatientUI.radius.md,
    marginTop: Spacing.two,
  },
  primaryBtnText: {
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
    opacity: 0.75,
  },
  summaryGrid: {
    gap: Spacing.two,
  },
  summaryGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
  },
  summaryGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryCard: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: 4,
    overflow: 'hidden',
  },
  summaryCardMobile: {
    width: '50%',
    padding: Spacing.one,
  },
  summaryCardWide: {
    flex: 1,
    minWidth: '23%',
  },
  summaryAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
    opacity: 0.7,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryUnit: {
    fontSize: 13,
  },
  summarySubtitle: {
    color: '#059669',
    fontSize: 12,
    marginTop: 2,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noticeText: {
    flex: 1,
    lineHeight: 20,
  },
  warning: {
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  warningText: {
    color: '#92400e',
    lineHeight: 18,
    fontSize: 13,
  },
  chartsStack: {
    gap: Spacing.four,
    width: '100%',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    width: '100%',
  },
  historySection: {
    gap: Spacing.two,
  },
  historyHeader: {
    gap: 4,
  },
  historyHint: {
    lineHeight: 18,
  },
  historyCards: {
    gap: Spacing.two,
  },
  historyCard: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  historyCardHeader: {
    gap: 2,
  },
  historyMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  historyMetric: {
    minWidth: '28%',
    gap: 2,
  },
  historyMetricCompact: {
    minWidth: '30%',
  },
  historyMetricLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  historyMetricValueCompact: {
    fontSize: 13,
  },
  velocityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tableWrap: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeadCell: {
    width: TABLE_COL_WIDTH,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  tableHeadText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableCell: {
    width: TABLE_COL_WIDTH,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
  },
});
