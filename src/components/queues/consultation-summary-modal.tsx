import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import {
  loadVisitConsultationSummaryWithPoll,
  type ConsultationPrefillResponse,
  type ConsultationTimelineEntry,
} from '@/services/consultation-summary-api';
import {
  EMPTY,
  buildAtAGlanceSummary,
  formatSummaryDisplayDate,
  hasVisitContent,
  toDetailedVisit,
  vitalsToChips,
  type DetailedVisit,
  type VitalChip,
} from '@/utils/consultation-summary';

type ConsultationSummaryModalProps = {
  visible: boolean;
  patientId: number;
  patientName: string;
  visitId: number;
  token: string | null;
  isEditMode?: boolean;
  onClose: () => void;
  onProceed: (data: ConsultationPrefillResponse | null) => void;
};

function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ConsultationSummaryModal({
  visible,
  patientName,
  visitId,
  token,
  isEditMode = false,
  onClose,
  onProceed,
}: ConsultationSummaryModalProps) {
  const theme = useTheme();
  const isTablet = useBreakpoint() !== 'mobile';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [waitingForCache, setWaitingForCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ConsultationPrefillResponse | null>(null);

  const cardWidth = isTablet ? Math.min(840, width - Spacing.five * 2) : width;
  const cardMaxHeight = isTablet ? height * 0.9 : height * 0.94;

  useEffect(() => {
    if (!visible || !token) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setWaitingForCache(true);
      setError(null);
      setData(null);

      try {
        const response = await loadVisitConsultationSummaryWithPoll(token, visitId, {
          maxAttempts: 30,
          intervalMs: 2000,
        });
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load consultation summary.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setWaitingForCache(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, token, visitId]);

  const visits = useMemo(
    () => (data?.consultation_records ?? []).map(toDetailedVisit),
    [data?.consultation_records]
  );

  const latestVisit = visits[0] ?? null;
  const previousVisits = visits.slice(1);
  const atAGlance = useMemo(
    () => buildAtAGlanceSummary(data?.ai?.clinical_summary, visits),
    [data?.ai?.clinical_summary, visits]
  );
  const timeline = data?.ai?.consultation_timeline ?? [];
  const todayVitalChips = vitalsToChips(data?.current_vital);
  const total = data?.total_consultations ?? 0;

  const subtitle = isEditMode ? 'Resuming consultation' : 'New consultation';
  const visitCountLabel =
    total === 0
      ? 'No prior visits on file'
      : `${total} documented visit${total === 1 ? '' : 's'}`;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType={isTablet ? 'fade' : 'slide'}
      transparent
      onRequestClose={handleClose}>
      <View style={[styles.overlay, isTablet && styles.overlayTablet]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} disabled={loading} />

        <View
          style={[
            styles.card,
            modalShadow,
            {
              backgroundColor: theme.background,
              borderColor: theme.backgroundSelected,
              width: cardWidth,
              maxHeight: cardMaxHeight,
              paddingBottom: isTablet ? 0 : Math.max(insets.bottom, Spacing.two),
            },
            isTablet ? styles.cardTablet : styles.cardMobile,
          ]}>
          {!isTablet ? (
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.backgroundSelected }]} />
            </View>
          ) : null}

          <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: Brand.primaryMuted }]}>
                <Ionicons name="sparkles-outline" size={20} color={Brand.primary} />
              </View>
              <ThemedText style={styles.title} numberOfLines={2}>
                {loading ? 'Preparing summary…' : 'Consultation summary'}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleClose}
              disabled={loading}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View
            style={[
              styles.hero,
              {
                backgroundColor: Brand.primaryMuted,
                borderBottomColor: theme.backgroundSelected,
              },
            ]}>
            <View style={[styles.heroAvatar, { backgroundColor: Brand.primary }]}>
              <ThemedText style={styles.heroAvatarText}>
                {patientInitials(patientName)}
              </ThemedText>
            </View>
            <View style={styles.heroText}>
              <ThemedText style={styles.patientName} numberOfLines={2}>
                {patientName}
              </ThemedText>
              <View style={styles.heroMeta}>
                <View style={[styles.metaChip, { backgroundColor: theme.background }]}>
                  <ThemedText type="smallBold" style={styles.metaChipText}>
                    {subtitle}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {visitCountLabel}
                </ThemedText>
              </View>
            </View>
          </View>

          {todayVitalChips.length > 0 ? (
            <View
              style={[
                styles.todayVitalsStrip,
                {
                  backgroundColor: theme.background,
                  borderBottomColor: theme.backgroundSelected,
                },
              ]}>
              <ThemedText style={styles.todayVitalsLabel}>Today&apos;s vitals</ThemedText>
              <VitalsChips chips={todayVitalChips} />
            </View>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.scrollContentTablet,
            ]}
            showsVerticalScrollIndicator={isTablet}
            keyboardShouldPersistTaps="handled">
            {loading ? (
              <View
                style={[
                  styles.loadingBox,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}>
                <View style={[styles.loadingRing, { borderColor: `${Brand.primary}30` }]}>
                  <ActivityIndicator size="large" color={Brand.primary} />
                </View>
                <ThemedText type="smallBold" style={styles.loadingTitle}>
                  {waitingForCache
                    ? 'Loading consultation summary'
                    : 'Generating clinical overview'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.loadingHint}>
                  {waitingForCache
                    ? 'Fetching AI summary from triage. This usually takes a few seconds.'
                    : 'Analyzing visit history for this patient.'}
                </ThemedText>
              </View>
            ) : null}

            {error && !loading ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#b91c1c" />
                <ThemedText type="small" style={styles.errorText}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            {!loading && !error && data ? (
              <>
                <SummaryPanel
                  title="Clinical overview"
                  icon="analytics-outline"
                  surfaceColor={theme.backgroundElement}
                  borderColor={theme.backgroundSelected}>
                  <ThemedText type="small" style={styles.overviewText}>
                    {atAGlance}
                  </ThemedText>
                </SummaryPanel>

                {timeline.length > 0 ? (
                  <TimelineSection
                    entries={timeline}
                    surfaceColor={theme.backgroundElement}
                    borderColor={theme.backgroundSelected}
                  />
                ) : null}

                {latestVisit ? (
                  <VisitDetailCard visit={latestVisit} highlight />
                ) : (
                  <View
                    style={[
                      styles.emptyVisit,
                      {
                        borderColor: theme.backgroundSelected,
                        backgroundColor: theme.backgroundElement,
                      },
                    ]}>
                    <Ionicons name="document-outline" size={28} color={theme.textSecondary} />
                    <ThemedText type="small" themeColor="textSecondary" style={styles.emptyVisitText}>
                      First visit — no prior consultation records on file.
                    </ThemedText>
                  </View>
                )}

                {previousVisits.length > 0 ? (
                  <View style={styles.previousSection}>
                    <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      Previous visits · {previousVisits.length}
                    </ThemedText>
                    {previousVisits.map(visit => (
                      <VisitDetailCard key={visit.id} visit={visit} collapsible />
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.backgroundSelected,
                backgroundColor: theme.background,
              },
              isTablet ? styles.footerTablet : styles.footerMobile,
            ]}>
            <Pressable
              onPress={handleClose}
              disabled={loading}
              style={({ pressed }) => [
                styles.cancelBtn,
                isTablet ? styles.footerBtnTablet : styles.footerBtnMobile,
                {
                  borderColor: '#fca5a5',
                  backgroundColor: theme.background,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button">
              <ThemedText type="smallBold" style={styles.cancelBtnText}>
                Cancel
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => onProceed(data)}
              disabled={loading}
              style={({ pressed }) => [
                styles.proceedBtn,
                isTablet ? styles.footerBtnProceedTablet : styles.footerBtnMobile,
                { backgroundColor: Brand.primary },
                pressed && styles.pressed,
                loading && styles.proceedBtnDisabled,
              ]}
              accessibilityRole="button">
              <ThemedText type="smallBold" style={styles.proceedBtnText}>
                Proceed to form
              </ThemedText>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function VitalsChips({ chips }: { chips: VitalChip[] }) {
  if (!chips.length) return null;
  return (
    <View style={styles.chipsRow}>
      {chips.map(chip => (
        <View key={chip.label} style={styles.chip}>
          <ThemedText style={styles.chipLabel}>{chip.label}</ThemedText>
          <ThemedText type="smallBold">{chip.value}</ThemedText>
        </View>
      ))}
    </View>
  );
}

function SummaryPanel({
  title,
  icon,
  children,
  surfaceColor,
  borderColor,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  surfaceColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.summaryPanel, { backgroundColor: surfaceColor, borderColor }]}>
      <View style={styles.panelTitleRow}>
        <Ionicons name={icon} size={16} color={Brand.primary} />
        <ThemedText style={styles.panelTitle}>{title}</ThemedText>
      </View>
      {children}
    </View>
  );
}

function TimelineSection({
  entries,
  surfaceColor,
  borderColor,
}: {
  entries: ConsultationTimelineEntry[];
  surfaceColor: string;
  borderColor: string;
}) {
  return (
    <SummaryPanel
      title="Visit timeline"
      icon="git-branch-outline"
      surfaceColor={surfaceColor}
      borderColor={borderColor}>
      <View style={styles.timelineList}>
        {entries.map((entry, index) => (
          <View key={entry.consultation_id ?? entry.date ?? index} style={styles.timelineItem}>
            <View style={styles.timelineDotCol}>
              <View style={styles.timelineDot} />
              {index < entries.length - 1 ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.timelineContent}>
              <ThemedText type="smallBold">{entry.date || '—'}</ThemedText>
              {entry.summary ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {entry.summary}
                </ThemedText>
              ) : null}
              {entry.key_findings ? (
                <ThemedText type="small" style={styles.timelineFindings}>
                  <ThemedText type="smallBold">Findings: </ThemedText>
                  {entry.key_findings}
                </ThemedText>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </SummaryPanel>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  if (!value || value === EMPTY) return null;
  return (
    <View style={styles.detailBlock}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText type="small" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function VisitDetailCard({
  visit,
  highlight = false,
  collapsible = false,
}: {
  visit: DetailedVisit;
  highlight?: boolean;
  collapsible?: boolean;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(!collapsible);

  if (!hasVisitContent(visit)) return null;

  const showBody = highlight || expanded;

  return (
    <View
      style={[
        styles.visitCard,
        highlight && styles.visitCardHighlight,
        {
          borderColor: highlight ? `${Brand.primary}45` : theme.backgroundSelected,
          backgroundColor: highlight ? `${Brand.primary}10` : theme.backgroundElement,
        },
      ]}>
      <Pressable
        onPress={collapsible ? () => setExpanded(v => !v) : undefined}
        disabled={!collapsible}
        style={styles.visitCardHeader}>
        <View style={styles.visitCardHeaderMain}>
          {highlight ? (
            <View style={styles.latestBadge}>
              <ThemedText style={styles.latestBadgeText}>Latest visit</ThemedText>
            </View>
          ) : null}
          <ThemedText
            type="smallBold"
            style={highlight ? styles.visitDateHighlight : undefined}
            numberOfLines={2}>
            {formatSummaryDisplayDate(visit.dateLabel)}
          </ThemedText>
          {visit.branch ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {visit.branch}
            </ThemedText>
          ) : null}
        </View>
        {collapsible ? (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.textSecondary}
          />
        ) : null}
      </Pressable>

      {showBody ? (
        <View style={styles.visitCardBody}>
          {visit.vitalsChips.length > 0 ? (
            <View style={styles.visitSection}>
              <ThemedText style={styles.detailLabel}>Vitals recorded</ThemedText>
              <VitalsChips chips={visit.vitalsChips} />
            </View>
          ) : null}

          <DetailBlock label="Chief complaint" value={visit.complaints} />
          <DetailBlock label="History of present illness" value={visit.hpi} />
          <DetailBlock label="Subjective" value={visit.subjective} />
          <DetailBlock label="Objective" value={visit.objective} />
          <DetailBlock label="Clinical findings" value={visit.clinicalFindings} />
          <DetailBlock label="Assessment" value={visit.assessment} />
          <DetailBlock label="Diagnosis" value={visit.diagnosis} />
          <DetailBlock label="Plan / Treatment" value={visit.planTreatment} />
          <DetailBlock label="Medication" value={visit.medication} />
          <DetailBlock label="Remarks" value={visit.remarks} />

          {visit.rxItems.length > 0 ? (
            <View style={styles.visitSection}>
              <ThemedText style={styles.detailLabel}>Prescription</ThemedText>
              {visit.rxItems.map((item, index) => (
                <ThemedText key={index} type="small" themeColor="textSecondary">
                  • {item}
                </ThemedText>
              ))}
            </View>
          ) : null}

          {visit.followUp ? (
            <View style={styles.followUpBox}>
              <Ionicons name="calendar-outline" size={16} color="#b45309" />
              <ThemedText type="small" style={styles.followUpText}>
                <ThemedText type="smallBold">Follow-up: </ThemedText>
                {visit.followUp}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const modalShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  android: { elevation: 16 },
  default: PatientUI.cardShadow,
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  overlayTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexShrink: 1,
  },
  cardMobile: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardTablet: {
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
      },
      android: { elevation: 20 },
      default: {},
    }),
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroText: {
    flex: 1,
    gap: Spacing.two,
    minWidth: 0,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroMeta: {
    gap: Spacing.one,
  },
  metaChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    color: Brand.primary,
    fontSize: 12,
  },
  todayVitalsStrip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  todayVitalsLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Brand.primary,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  scrollContentTablet: {
    paddingHorizontal: Spacing.five,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  loadingRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    textAlign: 'center',
    fontSize: 15,
  },
  loadingHint: {
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    flex: 1,
    color: '#b91c1c',
    lineHeight: 20,
  },
  summaryPanel: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Brand.primary,
  },
  overviewText: {
    lineHeight: 22,
    fontSize: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${Brand.primary}35`,
    backgroundColor: `${Brand.primary}14`,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 6,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: Brand.primary,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 48,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.primary,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: `${Brand.primary}35`,
    marginVertical: 4,
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    gap: 4,
    paddingBottom: Spacing.three,
  },
  timelineFindings: {
    lineHeight: 20,
  },
  emptyVisit: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyVisitText: {
    textAlign: 'center',
  },
  previousSection: {
    gap: Spacing.three,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  visitCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  visitCardHighlight: {
    borderWidth: 1.5,
  },
  visitCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  visitCardHeaderMain: {
    flex: 1,
    gap: Spacing.one,
  },
  visitCardBody: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  latestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    marginBottom: Spacing.one,
  },
  latestBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  visitDateHighlight: {
    color: Brand.primary,
    fontSize: 16,
  },
  visitSection: {
    gap: Spacing.two,
  },
  detailBlock: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    color: Brand.primary,
  },
  detailValue: {
    lineHeight: 21,
  },
  followUpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: Spacing.three,
  },
  followUpText: {
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerMobile: {
    flexDirection: 'column-reverse',
  },
  footerTablet: {
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.five,
  },
  footerBtnMobile: {
    width: '100%',
  },
  footerBtnTablet: {
    minWidth: 110,
  },
  footerBtnProceedTablet: {
    minWidth: 200,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 50,
  },
  cancelBtnText: {
    color: '#dc2626',
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 14,
    minHeight: 50,
  },
  proceedBtnDisabled: {
    opacity: 0.85,
  },
  proceedBtnText: {
    color: '#ffffff',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.9,
  },
});
