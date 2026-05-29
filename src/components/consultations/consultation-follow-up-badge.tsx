import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ConsultationFollowUp } from '@/services/consultations-api';
import {
  followUpStatusColor,
  formatFollowUpStatus,
  formatConsultationDate,
} from '@/utils/format-consultation';

type ConsultationFollowUpBadgeProps = {
  followUp: ConsultationFollowUp;
  compact?: boolean;
};

export function ConsultationFollowUpBadge({
  followUp,
  compact,
}: ConsultationFollowUpBadgeProps) {
  if (!followUp?.status) {
    return (
      <View style={[styles.row, compact && styles.rowCompact]}>
        <View style={[styles.dot, compact && styles.dotCompact, { backgroundColor: '#C9CED6' }]} />
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={[styles.noneText, compact && styles.noneTextCompact]}>
          NONE
        </ThemedText>
      </View>
    );
  }

  const color = followUpStatusColor(followUp.status);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <ThemedText type="smallBold" style={[styles.status, compact && styles.statusCompact]}>
          {formatFollowUpStatus(followUp.status)}
        </ThemedText>
      </View>
      {followUp.date ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
          {formatConsultationDate(followUp.date)}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowCompact: {
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCompact: {
    width: 7,
    height: 7,
  },
  status: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  statusCompact: {
    fontSize: 10,
  },
  noneText: {
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  noneTextCompact: {
    fontSize: 10,
  },
  date: {
    fontSize: 10,
    marginLeft: 14,
  },
});
