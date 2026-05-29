import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientAvatar } from '@/components/patients/patient-avatar';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import type { TriageVisit } from '@/services/triages-api';
import { formatTriageAge, formatTriageDate } from '@/utils/format-triage';

import { TriageAccent } from './triages-toolbar';

type TriageListViewProps = {
  visits: TriageVisit[];
  onPatientPress?: (visit: TriageVisit) => void;
  onStartPress?: (visit: TriageVisit) => void;
};

const TABLE_COLUMNS = [
  { key: 'date', label: 'Arrived', flex: 1 },
  { key: 'name', label: 'Patient', flex: 1.65 },
  { key: 'age', label: 'Age', flex: 0.65 },
  { key: 'actions', label: 'Action', flex: 1.2 },
] as const;

function formatWaitHint(walkedInAt: string): string {
  if (!walkedInAt) return '';
  const arrived = new Date(walkedInAt);
  if (Number.isNaN(arrived.getTime())) return '';
  const mins = Math.max(0, Math.floor((Date.now() - arrived.getTime()) / 60000));
  if (mins < 1) return 'Just arrived';
  if (mins < 60) return `Waiting ${mins}m`;
  const hours = Math.floor(mins / 60);
  return `Waiting ${hours}h ${mins % 60}m`;
}

export function TriageListView({
  visits,
  onPatientPress,
  onStartPress,
}: TriageListViewProps) {
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
              backgroundColor: TriageAccent.muted,
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
          <TriageTabletRow
            key={visit.id}
            visit={visit}
            index={index}
            isLast={index === visits.length - 1}
            onPatientPress={onPatientPress}
            onStartPress={onStartPress}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {visits.map((visit, index) => (
        <TriageMobileCard
          key={visit.id}
          visit={visit}
          position={index + 1}
          onPatientPress={onPatientPress}
          onStartPress={onStartPress}
        />
      ))}
    </View>
  );
}

function TriageTabletRow({
  visit,
  index,
  isLast,
  onPatientPress,
  onStartPress,
}: {
  visit: TriageVisit;
  index: number;
  isLast: boolean;
  onPatientPress?: (visit: TriageVisit) => void;
  onStartPress?: (visit: TriageVisit) => void;
}) {
  const theme = useTheme();
  const waitHint = formatWaitHint(visit.walked_in_at);
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
        {waitHint ? (
          <ThemedText type="small" style={styles.waitHint}>
            {waitHint}
          </ThemedText>
        ) : null}
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
      <View style={[styles.tabletCell, styles.tabletCellCenter, { flex: TABLE_COLUMNS[3].flex }]}>
        <StartButton onPress={() => onStartPress?.(visit)} compact />
      </View>
    </View>
  );
}

function TriageMobileCard({
  visit,
  position,
  onPatientPress,
  onStartPress,
}: {
  visit: TriageVisit;
  position: number;
  onPatientPress?: (visit: TriageVisit) => void;
  onStartPress?: (visit: TriageVisit) => void;
}) {
  const theme = useTheme();
  const waitHint = formatWaitHint(visit.walked_in_at);
  const hasComplaint = Boolean(visit.chief_complaint?.trim());

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
      <View style={[styles.cardAccent, { backgroundColor: TriageAccent.main }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.positionBadge, { backgroundColor: TriageAccent.muted }]}>
            <ThemedText type="smallBold" style={styles.positionText}>
              #{position}
            </ThemedText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: TriageAccent.muted }]}>
            <View style={[styles.statusDot, { backgroundColor: TriageAccent.main }]} />
            <ThemedText style={styles.statusText}>Vitals needed</ThemedText>
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
              <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatTriageDate(visit.walked_in_at)}
              </ThemedText>
              {waitHint ? (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    ·
                  </ThemedText>
                  <ThemedText type="small" style={styles.waitHint}>
                    {waitHint}
                  </ThemedText>
                </>
              ) : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Age {formatTriageAge(visit.patient.age)}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </Pressable>

        {hasComplaint ? (
          <View
            style={[
              styles.noteBox,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}>
            <Ionicons name="information-circle-outline" size={16} color={TriageAccent.main} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.noteText}>
              Front desk note: {visit.chief_complaint?.trim()}
            </ThemedText>
          </View>
        ) : (
          <View
            style={[
              styles.actionHint,
              { backgroundColor: TriageAccent.muted, borderColor: TriageAccent.border },
            ]}>
            <Ionicons name="pulse-outline" size={18} color={TriageAccent.main} />
            <ThemedText type="small" style={styles.actionHintText}>
              Tap Start to record vitals and chief complaint
            </ThemedText>
          </View>
        )}

        <StartButton onPress={() => onStartPress?.(visit)} />
      </View>
    </View>
  );
}

function StartButton({ onPress, compact }: { onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.startBtn,
        compact && styles.startBtnCompact,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Start triage and record vitals">
      <Ionicons name="fitness-outline" size={18} color="#ffffff" />
      <ThemedText type="smallBold" style={styles.startBtnText}>
        Start vitals
      </ThemedText>
      {!compact ? <Ionicons name="arrow-forward" size={16} color="#ffffff" /> : null}
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
    color: TriageAccent.main,
    fontSize: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: TriageAccent.main,
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
    gap: 4,
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
  waitHint: {
    color: TriageAccent.main,
    fontSize: 12,
    fontWeight: '600',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteText: {
    flex: 1,
    lineHeight: 18,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionHintText: {
    flex: 1,
    color: TriageAccent.main,
    fontSize: 13,
    lineHeight: 18,
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
    minHeight: 76,
  },
  tabletCell: {
    justifyContent: 'center',
    paddingRight: Spacing.two,
    minWidth: 0,
    gap: 2,
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
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 14,
    backgroundColor: TriageAccent.main,
    minHeight: 48,
  },
  startBtnCompact: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 40,
    borderRadius: 12,
  },
  startBtnText: {
    color: '#ffffff',
    letterSpacing: 0.3,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
