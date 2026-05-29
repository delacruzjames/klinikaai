import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientAvatar } from '@/components/patients/patient-avatar';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import type { QueueVisit } from '@/services/queues-api';
import { formatTriageAge, formatTriageDate } from '@/utils/format-triage';

type QueueListViewProps = {
  visits: QueueVisit[];
  onPatientPress?: (visit: QueueVisit) => void;
  onConsultationPress?: (visit: QueueVisit) => void;
};

const TABLE_COLUMNS = [
  { key: 'date', label: 'Date', flex: 1 },
  { key: 'name', label: 'Patient', flex: 1.6 },
  { key: 'age', label: 'Age', flex: 0.65 },
  { key: 'complaint', label: 'Chief complaint', flex: 1.35 },
  { key: 'actions', label: 'Actions', flex: 1.15 },
] as const;

export function QueueListView({
  visits,
  onPatientPress,
  onConsultationPress,
}: QueueListViewProps) {
  const isTablet = useBreakpoint() !== 'mobile';
  const theme = useTheme();

  if (visits.length === 0) return null;

  if (isTablet) {
    return (
      <View
        style={[
          styles.tabletCard,
          PatientUI.cardShadow,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
        ]}>
        <View
          style={[
            styles.tabletHeader,
            {
              backgroundColor: theme.backgroundElement,
              borderBottomColor: theme.backgroundSelected,
            },
          ]}>
          {TABLE_COLUMNS.map(col => (
            <ThemedText
              key={col.key}
              style={[
                styles.tabletHeaderCell,
                { flex: col.flex },
                col.key === 'actions' && styles.tabletHeaderCenter,
              ]}
              themeColor="textSecondary">
              {col.label}
            </ThemedText>
          ))}
        </View>
        {visits.map((visit, index) => (
          <QueueTabletRow
            key={visit.id}
            visit={visit}
            index={index}
            isLast={index === visits.length - 1}
            onPatientPress={onPatientPress}
            onConsultationPress={onConsultationPress}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {visits.map((visit, index) => (
        <QueueMobileCard
          key={visit.id}
          visit={visit}
          position={index + 1}
          onPatientPress={onPatientPress}
          onConsultationPress={onConsultationPress}
        />
      ))}
    </View>
  );
}

function QueueTabletRow({
  visit,
  index,
  isLast,
  onPatientPress,
  onConsultationPress,
}: {
  visit: QueueVisit;
  index: number;
  isLast: boolean;
  onPatientPress?: (visit: QueueVisit) => void;
  onConsultationPress?: (visit: QueueVisit) => void;
}) {
  const theme = useTheme();
  const complaint = visit.chief_complaint?.trim() || '—';
  const zebra = index % 2 === 1;

  return (
    <View
      style={[
        styles.tabletRow,
        zebra && { backgroundColor: `${theme.backgroundElement}80` },
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.backgroundSelected,
        },
      ]}>
      <View style={[styles.tabletCell, { flex: TABLE_COLUMNS[0].flex }]}>
        <ThemedText type="small">{formatTriageDate(visit.walked_in_at)}</ThemedText>
      </View>
      <Pressable
        style={[styles.tabletCell, { flex: TABLE_COLUMNS[1].flex }]}
        onPress={() => onPatientPress?.(visit)}
        accessibilityRole="button">
        <View style={styles.tabletNameRow}>
          <PatientAvatar fullname={visit.patient.fullname} size={40} />
          <ThemedText type="smallBold" numberOfLines={2} style={styles.tabletPatientName}>
            {visit.patient.fullname}
          </ThemedText>
        </View>
      </Pressable>
      <View style={[styles.tabletCell, { flex: TABLE_COLUMNS[2].flex }]}>
        <View style={[styles.agePill, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small">{formatTriageAge(visit.patient.age)}</ThemedText>
        </View>
      </View>
      <View style={[styles.tabletCell, { flex: TABLE_COLUMNS[3].flex }]}>
        <ThemedText type="small" numberOfLines={2}>
          {complaint}
        </ThemedText>
      </View>
      <View style={[styles.tabletCell, styles.tabletCellCenter, { flex: TABLE_COLUMNS[4].flex }]}>
        <ConsultationButton onPress={() => onConsultationPress?.(visit)} compact />
      </View>
    </View>
  );
}

function QueueMobileCard({
  visit,
  position,
  onPatientPress,
  onConsultationPress,
}: {
  visit: QueueVisit;
  position: number;
  onPatientPress?: (visit: QueueVisit) => void;
  onConsultationPress?: (visit: QueueVisit) => void;
}) {
  const theme = useTheme();
  const complaint = visit.chief_complaint?.trim() || '—';

  return (
    <View
      style={[
        styles.card,
        PatientUI.cardShadow,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <View style={[styles.cardAccent, { backgroundColor: Brand.primary }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.positionBadge, { backgroundColor: Brand.primaryMuted }]}>
            <ThemedText type="smallBold" style={styles.positionText}>
              #{position}
            </ThemedText>
          </View>
          <View style={[styles.readyPill, { backgroundColor: '#ecfdf5' }]}>
            <View style={styles.readyDot} />
            <ThemedText style={styles.readyText}>Ready</ThemedText>
          </View>
        </View>

        <Pressable
          onPress={() => onPatientPress?.(visit)}
          style={styles.cardHeader}
          accessibilityRole="button">
          <PatientAvatar fullname={visit.patient.fullname} size={52} />
          <View style={styles.cardHeaderText}>
            <ThemedText type="smallBold" numberOfLines={2} style={styles.cardName}>
              {visit.patient.fullname}
            </ThemedText>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatTriageDate(visit.walked_in_at)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ·
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Age {formatTriageAge(visit.patient.age)}
              </ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </Pressable>

        <View
          style={[
            styles.complaintBox,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.backgroundSelected,
            },
          ]}>
          <View style={styles.complaintHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={Brand.primary} />
            <ThemedText style={styles.complaintLabel}>Chief complaint</ThemedText>
          </View>
          <ThemedText type="small" style={styles.complaintValue} numberOfLines={4}>
            {complaint}
          </ThemedText>
        </View>

        <ConsultationButton onPress={() => onConsultationPress?.(visit)} />
      </View>
    </View>
  );
}

function ConsultationButton({ onPress, compact }: { onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.consultBtn,
        compact && styles.consultBtnCompact,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open consultation summary">
      <Ionicons name="document-text-outline" size={18} color={Brand.primary} />
      <ThemedText type="smallBold" style={styles.consultBtnText}>
        Consultation
      </ThemedText>
      {!compact ? <Ionicons name="arrow-forward" size={16} color={Brand.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  positionText: {
    color: Brand.primary,
    fontSize: 12,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  readyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cardHeaderText: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  cardName: {
    fontSize: 17,
    color: Brand.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  complaintBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  complaintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  complaintLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: Brand.primary,
  },
  complaintValue: {
    lineHeight: 20,
  },
  tabletCard: {
    marginHorizontal: Spacing.four,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabletHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabletHeaderCenter: {
    textAlign: 'center',
  },
  tabletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    minHeight: 72,
  },
  tabletCell: {
    justifyContent: 'center',
    paddingRight: Spacing.two,
    minWidth: 0,
  },
  tabletCellCenter: {
    alignItems: 'center',
    paddingRight: 0,
  },
  tabletNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tabletPatientName: {
    flex: 1,
    color: Brand.primary,
  },
  agePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  consultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    backgroundColor: `${Brand.primary}12`,
    minHeight: 48,
  },
  consultBtnCompact: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 40,
    borderRadius: 12,
  },
  consultBtnText: {
    color: Brand.primary,
    letterSpacing: 0.3,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
