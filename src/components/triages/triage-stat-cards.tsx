import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { formatAverageWait } from '@/utils/format-triage';

type StatCardConfig = {
  key: string;
  value: string;
  label: string;
  hint: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  trend?: string;
};

type TriageStatCardsProps = {
  waitingCount: number;
  readyCount: number;
  averageWaitMinutes: number | null;
  patientsToday: number;
  loading?: boolean;
};

export function TriageStatCards({
  waitingCount,
  readyCount,
  averageWaitMinutes,
  patientsToday,
  loading,
}: TriageStatCardsProps) {
  const theme = useTheme();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const cards: StatCardConfig[] = [
    {
      key: 'waiting',
      value: loading ? '—' : String(waitingCount),
      label: 'Waiting for Triage',
      hint: 'Patients in queue',
      icon: 'people-outline',
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
    },
    {
      key: 'ready',
      value: loading ? '—' : String(readyCount),
      label: 'Ready for Consultation',
      hint: 'Vitals captured',
      icon: 'clipboard-outline',
      iconColor: '#16a34a',
      iconBg: '#f0fdf4',
    },
    {
      key: 'wait',
      value: loading ? '—' : formatAverageWait(averageWaitMinutes),
      label: 'Average Wait Time',
      hint: 'From arrival',
      icon: 'time-outline',
      iconColor: '#ea580c',
      iconBg: '#fff7ed',
    },
    {
      key: 'today',
      value: loading ? '—' : String(patientsToday),
      label: 'Patients Today',
      hint: 'Arrivals logged today',
      icon: 'calendar-outline',
      iconColor: '#9333ea',
      iconBg: '#faf5ff',
    },
  ];

  return (
    <View style={[styles.grid, isMobile ? styles.gridMobile : styles.gridWide]}>
      {cards.map(card => (
        <View
          key={card.key}
          style={[
            isMobile ? styles.cardMobile : styles.cardWide,
            PatientUI.cardShadowLight,
            {
              backgroundColor: theme.background,
              borderColor: theme.backgroundSelected,
            },
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: card.iconBg }]}>
            <Ionicons name={card.icon} size={20} color={card.iconColor} />
          </View>
          <ThemedText style={styles.value}>{card.value}</ThemedText>
          <ThemedText type="smallBold" style={styles.label}>
            {card.label}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            {card.hint}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.three,
  },
  gridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  gridWide: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  cardMobile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: 4,
  },
  cardWide: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
