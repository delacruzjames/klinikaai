import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientAvatar } from '@/components/patients/patient-avatar';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TriageVisit } from '@/services/triages-api';
import {
  formatQueueIndex,
  formatTriageAge,
  formatTriageTime,
  formatWaitDuration,
  getWaitMinutes,
  isNewPatient,
} from '@/utils/format-triage';

type TriageListViewProps = {
  visits: TriageVisit[];
  startIndex?: number;
  onPatientPress?: (visit: TriageVisit) => void;
  onStartPress?: (visit: TriageVisit) => void;
};

function TypeBadge({ isNew }: { isNew: boolean }) {
  return (
    <View style={[styles.typeBadge, isNew ? styles.typeNew : styles.typeReturning]}>
      <ThemedText type="smallBold" style={[styles.typeText, isNew ? styles.typeNewText : styles.typeReturningText]}>
        {isNew ? 'New' : 'Returning'}
      </ThemedText>
    </View>
  );
}

function MetaCell({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  valueColor?: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.metaCell}>
      <View style={styles.metaCellLabelRow}>
        <Ionicons name={icon} size={14} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaLabel} numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      <ThemedText
        type="smallBold"
        numberOfLines={1}
        style={[styles.metaCellValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </ThemedText>
    </View>
  );
}

export function TriageListView({
  visits,
  startIndex = 0,
  onPatientPress,
  onStartPress,
}: TriageListViewProps) {
  if (visits.length === 0) return null;

  return (
    <View style={styles.grid}>
      {visits.map((visit, index) => (
        <View key={visit.id} style={styles.gridItem}>
          <TriageGridCard
            visit={visit}
            position={startIndex + index + 1}
            onPatientPress={onPatientPress}
            onStartPress={onStartPress}
          />
        </View>
      ))}
    </View>
  );
}

function TriageGridCard({
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
  const isNew = isNewPatient(visit.patient.date_created);
  const waitMinutes = getWaitMinutes(visit.walked_in_at);
  const assignedDoctor = visit.patient.doctor_name?.trim() || 'Unassigned';
  const waitColor = waitMinutes != null && waitMinutes < 1 ? '#16a34a' : '#ea580c';

  return (
    <View
      style={[
        styles.card,
        PatientUI.cardShadowLight,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <View style={[styles.cardHeader, { borderBottomColor: theme.backgroundSelected }]}>
        <Pressable
          onPress={() => onPatientPress?.(visit)}
          style={styles.cardHeaderMain}
          accessibilityRole="button">
          <View style={[styles.indexBadge, { backgroundColor: Brand.primaryMuted }]}>
            <ThemedText type="smallBold" style={styles.indexText}>
              {formatQueueIndex(position)}
            </ThemedText>
          </View>
          <PatientAvatar fullname={visit.patient.fullname} size={36} />
          <View style={styles.cardHeaderText}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.patientName}>
              {visit.patient.fullname}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.patientAge} numberOfLines={1}>
              Age: {formatTriageAge(visit.patient.age)}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </Pressable>
        <TypeBadge isNew={isNew} />
      </View>

      <View style={styles.metaGrid}>
        <MetaCell icon="time-outline" label="Arrived" value={formatTriageTime(visit.walked_in_at)} />
        <MetaCell
          icon="hourglass-outline"
          label="Waiting Time"
          value={formatWaitDuration(visit.walked_in_at)}
          valueColor={waitColor}
        />
        <MetaCell icon="walk-outline" label="Source" value="Walk-in" />
        <MetaCell icon="person-outline" label="Assigned Doctor" value={assignedDoctor} />
        <StartButton onPress={() => onStartPress?.(visit)} />
      </View>
    </View>
  );
}

function StartButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.startBtn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Start triage and record vitals">
      <ThemedText type="smallBold" style={styles.startBtnText}>
        Start
      </ThemedText>
      <Ionicons name="chevron-forward" size={12} color="#ffffff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: Spacing.two,
    gap: Spacing.two,
  },
  gridItem: {
    width: '100%',
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  indexBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indexText: {
    color: Brand.primary,
    fontSize: 11,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 0,
  },
  patientName: {
    fontSize: 14,
    lineHeight: 18,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  patientAge: {
    fontSize: 12,
    lineHeight: 16,
  },
  typeBadge: {
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  typeNew: {
    backgroundColor: Brand.primaryMuted,
  },
  typeReturning: {
    backgroundColor: '#f0fdf4',
  },
  typeText: {
    fontSize: 10,
  },
  typeNewText: {
    color: Brand.primary,
  },
  typeReturningText: {
    color: '#16a34a',
  },
  metaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  metaCell: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  metaCellLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  metaCellValue: {
    fontSize: 13,
    lineHeight: 17,
  },
  startBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Brand.primary,
    minHeight: 32,
    marginLeft: Spacing.one,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.92,
  },
});
