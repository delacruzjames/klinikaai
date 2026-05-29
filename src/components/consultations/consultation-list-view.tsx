import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ConsultationFollowUpBadge } from '@/components/consultations/consultation-follow-up-badge';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import type { Consultation } from '@/services/consultations-api';
import { formatConsultationDate, formatConsultationField } from '@/utils/format-consultation';

type ConsultationListViewProps = {
  consultations: Consultation[];
  showPatient?: boolean;
  showBranch?: boolean;
  onConsultationPress?: (consultation: Consultation) => void;
};

type ColumnDef = { key: string; label: string; flex: number };

export function ConsultationListView({
  consultations,
  showPatient = false,
  showBranch = true,
  onConsultationPress,
}: ConsultationListViewProps) {
  const isTablet = useBreakpoint() !== 'mobile';
  const theme = useTheme();

  if (consultations.length === 0) return null;

  const columns: ColumnDef[] = [
    { key: 'date', label: 'Date', flex: 1.1 },
    ...(showBranch ? [{ key: 'branch', label: 'Branch', flex: 1.15 }] : []),
    ...(showPatient ? [{ key: 'patient', label: 'Patient', flex: 1.35 }] : []),
    { key: 'complaint', label: 'Chief complaint', flex: 1.6 },
    { key: 'diagnosis', label: 'Diagnosis', flex: 1.4 },
    { key: 'followup', label: 'Follow up', flex: 1 },
  ];

  if (isTablet) {
    return (
      <View
        style={[
          styles.tableCard,
          PatientUI.cardShadow,
          { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
        ]}>
        <View
          style={[
            styles.tableHead,
            { backgroundColor: theme.backgroundElement, borderBottomColor: theme.backgroundSelected },
          ]}>
          {columns.map(col => (
            <HeadCell key={col.key} label={col.label} flex={col.flex} />
          ))}
          <View style={styles.headChevron} />
        </View>
        {consultations.map((item, index) => (
          <ConsultationTableRow
            key={item.id}
            consultation={item}
            columns={columns}
            striped={index % 2 === 1}
            onPress={onConsultationPress}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.cardList}>
      {consultations.map((item, index) => (
        <ConsultationCard
          key={item.id}
          consultation={item}
          showPatient={showPatient}
          showBranch={showBranch}
          isFirst={index === 0}
          onPress={onConsultationPress}
        />
      ))}
    </View>
  );
}

function HeadCell({ label, flex }: { label: string; flex: number }) {
  return (
    <View style={[styles.headCell, { flex }]}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.headText}>
        {label}
      </ThemedText>
    </View>
  );
}

function ConsultationTableRow({
  consultation,
  columns,
  striped,
  onPress,
}: {
  consultation: Consultation;
  columns: ColumnDef[];
  striped: boolean;
  onPress?: (c: Consultation) => void;
}) {
  const theme = useTheme();
  const complaint = formatConsultationField(consultation.complaints);
  const diagnosis = formatConsultationField(consultation.diagnosis);

  const cellContent: Record<string, ReactNode> = {
    date: <ThemedText type="smallBold">{formatConsultationDate(consultation.date)}</ThemedText>,
    branch: (
      <ThemedText type="small" numberOfLines={2}>
        {consultation.branch_name || '—'}
      </ThemedText>
    ),
    patient: (
      <ThemedText type="smallBold" numberOfLines={2} style={{ color: Brand.primary }}>
        {consultation.patient_fullname || '—'}
      </ThemedText>
    ),
    complaint: (
      <ThemedText type="small" numberOfLines={3}>
        {complaint}
      </ThemedText>
    ),
    diagnosis: (
      <ThemedText type="small" numberOfLines={3}>
        {diagnosis}
      </ThemedText>
    ),
    followup: <ConsultationFollowUpBadge followUp={consultation.latest_follow_up} compact />,
  };

  return (
    <Pressable
      onPress={() => onPress?.(consultation)}
      style={({ pressed }) => [
        styles.tableRow,
        striped && { backgroundColor: `${theme.backgroundElement}60` },
        { borderBottomColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button">
      {columns.map(col => (
        <View key={col.key} style={[styles.cell, { flex: col.flex }]}>
          {cellContent[col.key]}
        </View>
      ))}
      <View style={styles.rowChevron}>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

function ConsultationCard({
  consultation,
  showPatient,
  showBranch,
  isFirst,
  onPress,
}: {
  consultation: Consultation;
  showPatient: boolean;
  showBranch: boolean;
  isFirst?: boolean;
  onPress?: (c: Consultation) => void;
}) {
  const theme = useTheme();
  const complaint = formatConsultationField(consultation.complaints);
  const diagnosis = formatConsultationField(consultation.diagnosis);
  const isEmptyComplaint = complaint === '—';
  const isEmptyDiagnosis = diagnosis === '—';

  return (
    <Pressable
      onPress={() => onPress?.(consultation)}
      style={({ pressed }) => [
        styles.card,
        PatientUI.cardShadowLight,
        isFirst && styles.cardFirst,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={[styles.dateIcon, { backgroundColor: Brand.primaryMuted }]}>
          <Ionicons name="calendar-outline" size={20} color={Brand.primary} />
        </View>
        <View style={styles.cardTopText}>
          <ThemedText type="smallBold" style={styles.cardDate}>
            {formatConsultationDate(consultation.date)}
          </ThemedText>
          {showBranch && consultation.branch_name ? (
            <View style={[styles.branchPill, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="business-outline" size={12} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {consultation.branch_name}
              </ThemedText>
            </View>
          ) : null}
          {showPatient && consultation.patient_fullname ? (
            <View style={styles.patientRow}>
              <View style={[styles.patientDot, { backgroundColor: `${Brand.primary}20` }]}>
                <ThemedText type="smallBold" style={styles.patientInitials}>
                  {getInitials(consultation.patient_fullname)}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ color: Brand.primary }} numberOfLines={1}>
                {consultation.patient_fullname}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.cardTopEnd}>
          <ConsultationFollowUpBadge followUp={consultation.latest_follow_up} />
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </View>
      </View>

      <View
        style={[
          styles.metricsList,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}>
        <MetricRow
          icon="chatbubble-ellipses-outline"
          iconColor="#3b82f6"
          label="Chief complaint"
          value={complaint}
          isEmpty={isEmptyComplaint}
          borderColor={theme.backgroundSelected}
          showBorder
        />
        <MetricRow
          icon="medkit-outline"
          iconColor="#8b5cf6"
          label="Diagnosis"
          value={diagnosis}
          isEmpty={isEmptyDiagnosis}
          borderColor={theme.backgroundSelected}
        />
      </View>
    </Pressable>
  );
}

function MetricRow({
  icon,
  iconColor,
  label,
  value,
  isEmpty,
  borderColor,
  showBorder,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  isEmpty: boolean;
  borderColor: string;
  showBorder?: boolean;
}) {
  return (
    <View
      style={[
        styles.metricRow,
        showBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}>
      <View style={[styles.metricIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.metricContent}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metricLabel}>
          {label}
        </ThemedText>
        <ThemedText
          type="small"
          numberOfLines={4}
          style={[styles.metricValue, isEmpty && styles.metricEmpty]}>
          {isEmpty ? 'Not recorded' : value}
        </ThemedText>
      </View>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const styles = StyleSheet.create({
  cardList: {
    width: '100%',
    gap: Spacing.three,
  },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardFirst: {
    borderColor: `${Brand.primary}35`,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  dateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTopText: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  cardDate: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: PatientUI.radius.sm,
    maxWidth: '100%',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  patientDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitials: {
    fontSize: 11,
    color: Brand.primary,
  },
  cardTopEnd: {
    alignItems: 'flex-end',
    gap: Spacing.two,
    flexShrink: 0,
  },
  metricsList: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  metricLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  metricEmpty: {
    fontStyle: 'italic',
    opacity: 0.65,
  },
  tableCard: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headCell: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
    minWidth: 0,
  },
  headText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  headChevron: {
    width: 36,
    flexShrink: 0,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
    minWidth: 0,
  },
  rowChevron: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.88,
  },
});
