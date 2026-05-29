import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientInfoField } from '@/components/patients/patient-info-field';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import type { PatientDetail } from '@/services/patients-api';

function ActionIconButton({
  icon,
  label,
  backgroundColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  backgroundColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionIconBtn,
        PatientUI.cardShadowLight,
        { backgroundColor },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={20} color="#ffffff" />
    </Pressable>
  );
}

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</ThemedText>
      <View style={styles.sectionGrid}>{children}</View>
    </View>
  );
}

type PatientDetailsTabProps = {
  patient: PatientDetail;
  onEdit?: () => void;
  onTriage?: () => void;
  onDownloadPdf?: () => void;
  onDelete?: () => void;
};

export function PatientDetailsTab({
  patient,
  onEdit,
  onTriage,
  onDownloadPdf,
  onDelete,
}: PatientDetailsTabProps) {
  const theme = useTheme();
  const isMobile = useBreakpoint() === 'mobile';
  const fieldWidth = isMobile ? '100%' : '48%';

  return (
    <View
      style={[
        styles.panel,
        PatientUI.cardShadow,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <View style={styles.header}>
        <ThemedText style={styles.panelTitle}>Information</ThemedText>
        <View style={styles.actions}>
          <ActionIconButton
            icon="create-outline"
            label="Edit patient"
            backgroundColor="#f59e0b"
            onPress={onEdit}
          />
          <ActionIconButton
            icon="medkit-outline"
            label="Send to triage"
            backgroundColor="#22c55e"
            onPress={onTriage}
          />
          <ActionIconButton
            icon="download-outline"
            label="Download PDF"
            backgroundColor={Brand.primary}
            onPress={onDownloadPdf}
          />
        </View>
      </View>

      <FieldSection title="Personal">
        <PatientInfoField label="First Name" value={patient.first_name} width={fieldWidth} />
        <PatientInfoField label="Middle Name" value={patient.middle_name} width={fieldWidth} />
        <PatientInfoField label="Last Name" value={patient.last_name} width={fieldWidth} />
        <PatientInfoField label="Date of Birth" value={patient.date_of_birth_in_words} width={fieldWidth} />
        <PatientInfoField label="Age" value={patient.age} width={fieldWidth} />
        <PatientInfoField label="Gender" value={patient.gender} width={fieldWidth} />
        <PatientInfoField label="Blood Type" value={patient.blood_type} width={fieldWidth} />
        <PatientInfoField label="Civil Status" value={patient.civil_status} width={fieldWidth} />
        <PatientInfoField label="Nationality" value={patient.nationality} width={fieldWidth} />
        <PatientInfoField label="Race" value={patient.race} width={fieldWidth} />
        <PatientInfoField label="Religion" value={patient.religion} width={fieldWidth} />
        <PatientInfoField label="Nickname" value={patient.nickname} width={fieldWidth} />
        <PatientInfoField label="Occupation" value={patient.occupation} width={fieldWidth} />
        <PatientInfoField label="PhilHealth" value={patient.phil_health_number} width={fieldWidth} />
      </FieldSection>

      <FieldSection title="Contact">
        <PatientInfoField label="Address" value={patient.address} width={fieldWidth} />
        <PatientInfoField label="Email" value={patient.email} width={fieldWidth} />
        <PatientInfoField
          label="Mobile"
          value={patient.mobile_number || patient.tel_or_mobile}
          width={fieldWidth}
        />
        <PatientInfoField label="Other Mobile" value={patient.other_mobile_number} width={fieldWidth} />
      </FieldSection>

      <View style={[styles.footer, { borderTopColor: theme.backgroundSelected }]}>
        <View style={[styles.footerCard, { backgroundColor: Brand.primaryMuted }]}>
          <ThemedText type="small" style={styles.footerLabel}>
            Created by
          </ThemedText>
          <ThemedText type="smallBold" style={styles.footerValue} numberOfLines={2}>
            {patient.created_by?.trim() || 'N/A'}
          </ThemedText>
        </View>
        <View style={[styles.footerCard, { backgroundColor: Brand.primaryMuted }]}>
          <ThemedText type="small" style={styles.footerLabel}>
            Assigned doctor
          </ThemedText>
          <ThemedText type="smallBold" style={styles.footerValue} numberOfLines={2}>
            {patient.doctor_name?.trim() || 'None'}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => {
            Alert.alert('Delete patient', 'This action is not available in the app yet.');
            onDelete?.();
          }}
          style={({ pressed }) => [
            styles.deleteBtn,
            { borderColor: theme.backgroundSelected },
            pressed && styles.pressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Delete patient">
          <Ionicons name="trash-outline" size={22} color="#e5484d" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.lg,
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  panelTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 0,
  },
  actionIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.four,
  },
  footerCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    gap: 4,
  },
  footerLabel: {
    color: Brand.primary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footerValue: {
    color: Brand.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.85,
  },
});
