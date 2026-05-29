import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { VITAL_ROWS, type VitalRowKey } from '@/constants/vitals-rows';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { fetchConsultationById, type ConsultationDetail } from '@/services/consultations-api';
import type { PatientDetail } from '@/services/patients-api';
import { formatConsultationDate, formatConsultationField } from '@/utils/format-consultation';
import { formatVitalDisplay } from '@/utils/format-vitals';

type ConsultationDetailViewProps = {
  consultation: ConsultationDetail;
  patient: PatientDetail | null;
  /** Renders inside patient profile scroll — keeps hero/tabs visible. */
  embedded?: boolean;
  onBack?: () => void;
};

type SectionKey =
  | 'complaints'
  | 'hpi'
  | 'remarks'
  | 'diagnosis'
  | 'plan_treatment';

type SectionDef = {
  key: SectionKey | 'vitals' | 'attachments';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const CLINICAL_LEFT: SectionDef[] = [
  { key: 'complaints', label: 'Chief complaint', icon: 'chatbubble-ellipses-outline', color: '#3b82f6' },
  { key: 'hpi', label: 'HPI', icon: 'document-text-outline', color: '#0ea5e9' },
  { key: 'remarks', label: 'Remarks', icon: 'chatbox-outline', color: '#64748b' },
];

const CLINICAL_RIGHT: SectionDef[] = [
  { key: 'diagnosis', label: 'Diagnosis', icon: 'medkit-outline', color: '#8b5cf6' },
  { key: 'plan_treatment', label: 'Treatment plan', icon: 'clipboard-outline', color: '#22c55e' },
];

const VITALS_SECTION: SectionDef = {
  key: 'vitals',
  label: 'Vitals',
  icon: 'pulse-outline',
  color: '#ef4444',
};

const ATTACHMENTS_SECTION: SectionDef = {
  key: 'attachments',
  label: 'Attachments',
  icon: 'attach-outline',
  color: Brand.primary,
};

// Mobile reading order: complaint → hpi → diagnosis → plan → vitals → remarks → attachments
const MOBILE_ORDER: SectionDef[] = [
  CLINICAL_LEFT[0],
  CLINICAL_LEFT[1],
  CLINICAL_RIGHT[0],
  CLINICAL_RIGHT[1],
  VITALS_SECTION,
  CLINICAL_LEFT[2],
  ATTACHMENTS_SECTION,
];

const VITAL_GROUPS: { title: string; keys: VitalRowKey[] }[] = [
  { title: 'Body measurements', keys: ['height_cm', 'weight_kg', 'bmi', 'body_surface_area_m2'] },
  {
    title: 'Vital signs',
    keys: ['heart_rate', 'blood_pressure', 'spo2', 'respiratory_rate', 'temperature_c'],
  },
  { title: 'Glucose', keys: ['cbg_mg_dl'] },
];

const rowByKey = Object.fromEntries(VITAL_ROWS.map(row => [row.key, row])) as Record<
  VitalRowKey,
  (typeof VITAL_ROWS)[number]
>;

export function ConsultationDetailView({
  consultation,
  patient,
  embedded = false,
  onBack,
}: ConsultationDetailViewProps) {
  const router = useRouter();
  const theme = useTheme();
  const breakpoint = useBreakpoint();
  const { width } = useWindowDimensions();

  const isMobile = breakpoint === 'mobile';
  const isDesktop = !embedded && breakpoint === 'desktop';
  const contentMaxWidth = isDesktop ? Math.min(1200, width) : width;

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const patientName =
    patient?.fullname ||
    consultation.patient_fullname ||
    [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') ||
    '—';
  const doctorName = patient?.doctor_name?.trim() || null;
  const patientGender = patient?.gender?.trim() || 'N/A';
  const patientAge = formatPatientAge(patient?.age);
  const visitDate = consultation.date
    ? formatConsultationDate(consultation.date)
    : '—';

  const handleEdit = () => {
    Alert.alert('Edit consultation', 'Editing consultations is not available in the mobile app yet.');
  };

  const openAttachment = async (url: string | null) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Unable to open', 'This attachment cannot be opened on this device.');
    } catch {
      Alert.alert('Unable to open', 'This attachment cannot be opened on this device.');
    }
  };

  const renderSection = (section: SectionDef) => {
    if (section.key === 'vitals') {
      return (
        <DetailSection key={section.key} def={section} compact={isMobile}>
          <VitalsContent vital={consultation.vital} isMobile={isMobile} isDesktop={isDesktop} />
        </DetailSection>
      );
    }

    if (section.key === 'attachments') {
      return (
        <DetailSection key={section.key} def={section} compact={isMobile}>
          <AttachmentsContent
            attachments={consultation.attachments}
            onOpen={openAttachment}
          />
        </DetailSection>
      );
    }

    const value = formatConsultationField(consultation[section.key]);
    return (
      <DetailSection key={section.key} def={section} compact={isMobile}>
        <TextContent value={value} />
      </DetailSection>
    );
  };

  const body = (
      <View
        style={[
          embedded ? styles.shellEmbedded : styles.shell,
          PatientUI.cardShadow,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
            maxWidth: embedded ? undefined : contentMaxWidth,
          },
        ]}>
        {!embedded ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backRow,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={theme.text} />
            <ThemedText type="smallBold">Back</ThemedText>
          </Pressable>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={[styles.heroIcon, { backgroundColor: Brand.primaryMuted }]}>
              <Ionicons name="calendar-outline" size={26} color={Brand.primary} />
            </View>
            <View style={styles.heroText}>
              <ThemedText style={styles.heroTitle}>Consultation overview</ThemedText>
              {doctorName ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                  Dr. {doctorName}
                </ThemedText>
              ) : null}
              <View style={styles.heroMetaRow}>
                <View style={[styles.datePill, { backgroundColor: theme.backgroundElement }]}>
                  <Ionicons name="time-outline" size={14} color={Brand.primary} />
                  <ThemedText type="smallBold" style={{ color: Brand.primary }}>
                    {visitDate}
                  </ThemedText>
                </View>
                {consultation.branch_name ? (
                  <View style={[styles.branchPill, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {consultation.branch_name}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleEdit}
            style={({ pressed }) => [
              styles.editActionBtn,
              PatientUI.cardShadowLight,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit consultation">
            <Ionicons name="create-outline" size={20} color="#ffffff" />
          </Pressable>
        </View>

        {!embedded ? (
          <PatientMetaBar
            patientName={patientName}
            gender={patientGender}
            age={patientAge}
            date={consultation.date || '—'}
            branch={consultation.branch_name || '—'}
            isMobile={isMobile}
          />
        ) : (
          <View
            style={[
              styles.embeddedVisitBar,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            ]}>
            <MetaInline label="Visit date" value={consultation.date || '—'} />
            <View style={[styles.metaDivider, { backgroundColor: theme.backgroundSelected }]} />
            <MetaInline label="Branch" value={consultation.branch_name || '—'} />
            {patientGender !== 'N/A' ? (
              <>
                <View style={[styles.metaDivider, { backgroundColor: theme.backgroundSelected }]} />
                <MetaInline label="Gender" value={patientGender} />
              </>
            ) : null}
          </View>
        )}

        {isMobile ? (
          <View style={styles.sectionStack}>{MOBILE_ORDER.map(renderSection)}</View>
        ) : (
          <View style={styles.columns}>
            <View style={styles.column}>
              {CLINICAL_LEFT.map(renderSection)}
              {renderSection(ATTACHMENTS_SECTION)}
            </View>
            <View style={styles.column}>
              {CLINICAL_RIGHT.map(renderSection)}
              {renderSection(VITALS_SECTION)}
            </View>
          </View>
        )}
      </View>
  );

  if (embedded) {
    return body;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, isDesktop && { alignItems: 'center' }]}
      showsVerticalScrollIndicator={false}>
      {body}
    </ScrollView>
  );
}

function formatPatientAge(age: string | undefined): string {
  if (!age?.trim()) return 'N/A';
  if (/yr/i.test(age)) return age;
  if (/\d/.test(age)) return `${age} yrs old`;
  return age;
}

function PatientMetaBar({
  patientName,
  gender,
  age,
  date,
  branch,
  isMobile,
}: {
  patientName: string;
  gender: string;
  age: string;
  date: string;
  branch: string;
  isMobile: boolean;
}) {
  const theme = useTheme();
  const items = [
    { label: 'Patient', value: patientName, icon: 'person-outline' as const },
    { label: 'Gender', value: gender, icon: 'male-female-outline' as const },
    { label: 'Age', value: age, icon: 'hourglass-outline' as const },
    { label: 'Date', value: date, icon: 'calendar-outline' as const },
    { label: 'Branch', value: branch, icon: 'business-outline' as const },
  ];

  if (isMobile) {
    return (
      <View
        style={[
          styles.metaGridMobile,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}>
        {items.map(item => (
          <MetaTile key={item.label} {...item} />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.metaRowTablet,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      {items.map((item, index) => (
        <View key={item.label} style={styles.metaRowItemWrap}>
          {index > 0 ? (
            <View style={[styles.metaDivider, { backgroundColor: theme.backgroundSelected }]} />
          ) : null}
          <MetaInline {...item} />
        </View>
      ))}
    </View>
  );
}

function MetaTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.metaTile,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
      ]}>
      <View style={styles.metaTileTop}>
        <Ionicons name={icon} size={14} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaTileLabel}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" numberOfLines={2}>
        {value}
      </ThemedText>
    </View>
  );
}

function MetaInline({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaInline}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.metaInlineLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

function DetailSection({
  def,
  children,
  compact,
}: {
  def: SectionDef;
  children: ReactNode;
  compact?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.section,
        PatientUI.cardShadowLight,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
      ]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${def.color}18` }]}>
          <Ionicons name={def.icon} size={20} color={def.color} />
        </View>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          {def.label}
        </ThemedText>
      </View>
      <View
        style={[
          styles.sectionBody,
          compact && styles.sectionBodyCompact,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}>
        {children}
      </View>
    </View>
  );
}

function TextContent({ value }: { value: string }) {
  const isEmpty = value === '—' || !value;

  if (isEmpty) {
    return <EmptyValue text="No data" />;
  }

  return (
    <ThemedText type="small" style={styles.bodyText}>
      {value}
    </ThemedText>
  );
}

function VitalsContent({
  vital,
  isMobile,
  isDesktop,
}: {
  vital: ConsultationDetail['vital'];
  isMobile: boolean;
  isDesktop: boolean;
}) {
  const theme = useTheme();

  if (!vital) {
    return <EmptyValue text="No vitals recorded" />;
  }

  if (isMobile) {
    return (
      <View style={styles.vitalsGroups}>
        {VITAL_GROUPS.map(group => (
          <View key={group.title} style={styles.vitalGroup}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.vitalGroupTitle}>
              {group.title}
            </ThemedText>
            <View
              style={[
                styles.vitalMetricList,
                { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
              ]}>
              {group.keys.map((key, index) => {
                const row = rowByKey[key];
                const display = formatVitalDisplay(vital, key);
                const isLast = index === group.keys.length - 1;

                return (
                  <View
                    key={key}
                    style={[
                      styles.vitalMetricRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.backgroundSelected,
                      },
                    ]}>
                    <View style={[styles.vitalMetricIcon, { backgroundColor: `${row.color}18` }]}>
                      <Ionicons name={row.icon} size={18} color={row.color} />
                    </View>
                    <View style={styles.vitalMetricContent}>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                        {row.label.replace(/\s*\([^)]*\)/, '')}
                      </ThemedText>
                      {!display ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.metricEmpty}>
                          —
                        </ThemedText>
                      ) : (
                        <View style={styles.vitalValueRow}>
                          <ThemedText type="smallBold">{display.primary}</ThemedText>
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
      </View>
    );
  }

  const itemBasis = isDesktop ? '31%' : '48%';

  return (
    <View style={styles.vitalsGrid}>
      {VITAL_ROWS.map(row => {
        const display = formatVitalDisplay(vital, row.key);
        const label = row.label.replace(/\s*\([^)]*\)/, '');

        return (
          <View
            key={row.key}
            style={[styles.vitalGridItem, { flexBasis: itemBasis, maxWidth: itemBasis }]}>
            <View style={[styles.vitalGridIcon, { backgroundColor: `${row.color}18` }]}>
              <Ionicons name={row.icon} size={16} color={row.color} />
            </View>
            <View style={styles.vitalGridText}>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.vitalGridLabel}>
                {label}
              </ThemedText>
              {!display ? (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  —
                </ThemedText>
              ) : (
                <ThemedText type="smallBold" numberOfLines={1}>
                  {display.primary}
                  {display.unit ? ` ${display.unit}` : ''}
                </ThemedText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AttachmentsContent({
  attachments,
  onOpen,
}: {
  attachments: ConsultationDetail['attachments'];
  onOpen: (url: string | null) => void;
}) {
  const theme = useTheme();

  if (attachments.length === 0) {
    return <EmptyValue text="No attachments" />;
  }

  return (
    <View style={styles.attachmentList}>
      {attachments.map(att => {
        const name =
          att.custom_filename ||
          (att.url ? decodeURIComponent(att.url.split('/').pop() || '') : '') ||
          'Attachment';
        const isPdf = name.toLowerCase().endsWith('.pdf');

        return (
          <Pressable
            key={att.id}
            onPress={() => onOpen(att.url)}
            style={({ pressed }) => [
              styles.attachmentRow,
              {
                backgroundColor: theme.background,
                borderColor: theme.backgroundSelected,
              },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button">
            <View style={[styles.attachmentIcon, { backgroundColor: `${Brand.primary}15` }]}>
              <Ionicons
                name={isPdf ? 'document-text-outline' : 'image-outline'}
                size={22}
                color={Brand.primary}
              />
            </View>
            <View style={styles.attachmentText}>
              <ThemedText type="smallBold" numberOfLines={2}>
                {name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tap to open
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyValue({ text }: { text: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
      {text}
    </ThemedText>
  );
}

type ConsultationDetailLoaderProps = {
  patientId: number;
  consultationId: number;
  patient: PatientDetail | null;
  embedded?: boolean;
  onBack?: () => void;
};

/** Loads consultation data and renders {@link ConsultationDetailView}. */
export function ConsultationDetailLoader({
  patientId,
  consultationId,
  patient,
  embedded = false,
  onBack,
}: ConsultationDetailLoaderProps) {
  const { token } = useAuth();
  const theme = useTheme();

  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setError('You are not signed in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchConsultationById(token, patientId, consultationId);
      setConsultation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consultation.');
      setConsultation(null);
    } finally {
      setLoading(false);
    }
  }, [consultationId, patientId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const loaderPanelStyle = [
    loaderStyles.centered,
    PatientUI.cardShadow,
    { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
  ];

  if (loading && !consultation) {
    return (
      <View style={loaderPanelStyle}>
        <ActivityIndicator size="large" color={Brand.primary} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading consultation…
        </ThemedText>
      </View>
    );
  }

  if (error && !consultation) {
    return (
      <View style={loaderPanelStyle}>
        <ThemedText type="small" themeColor="textSecondary">
          {error}
        </ThemedText>
        <Pressable onPress={load} accessibilityRole="button">
          <ThemedText type="linkPrimary">Retry</ThemedText>
        </Pressable>
        {onBack && !embedded ? (
          <Pressable onPress={onBack} accessibilityRole="button">
            <ThemedText type="linkPrimary">Back</ThemedText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!consultation) {
    return null;
  }

  return (
    <ConsultationDetailView
      consultation={consultation}
      patient={patient}
      embedded={embedded}
      onBack={onBack}
    />
  );
}

const loaderStyles = StyleSheet.create({
  centered: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.lg,
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: Spacing.six,
  },
  shell: {
    width: '100%',
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  shellEmbedded: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.lg,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  embeddedVisitBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: PatientUI.radius.md,
  },
  pressed: {
    opacity: 0.85,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  heroMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    minWidth: 0,
  },
  editActionBtn: {
    width: 44,
    height: 44,
    borderRadius: PatientUI.radius.md,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroText: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: 2,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: PatientUI.radius.sm,
    maxWidth: '100%',
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: PatientUI.radius.sm,
    flexShrink: 1,
    maxWidth: '100%',
  },
  metaGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaTile: {
    width: '47%',
    flexGrow: 1,
    padding: Spacing.two,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    minWidth: 140,
  },
  metaTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTileLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    fontWeight: '600',
  },
  metaRowTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  metaRowItemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  metaDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    marginHorizontal: Spacing.two,
  },
  metaInline: {
    gap: 2,
    minWidth: 72,
    maxWidth: 200,
  },
  metaInlineLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    fontWeight: '600',
  },
  sectionStack: {
    width: '100%',
    gap: Spacing.three,
  },
  columns: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.four,
  },
  column: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.three,
  },
  section: {
    width: '100%',
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  sectionBody: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    minHeight: 88,
  },
  sectionBodyCompact: {
    minHeight: 72,
  },
  bodyText: {
    lineHeight: 22,
    fontSize: 15,
  },
  emptyText: {
    fontStyle: 'italic',
  },
  vitalsGroups: {
    gap: Spacing.three,
  },
  vitalGroup: {
    gap: Spacing.two,
  },
  vitalGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  vitalMetricList: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  vitalMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  vitalMetricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vitalMetricContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  metricEmpty: {
    fontStyle: 'italic',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  vitalGridItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    flexGrow: 1,
  },
  vitalGridIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vitalGridText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  vitalGridLabel: {
    fontSize: 11,
  },
  attachmentList: {
    gap: Spacing.two,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  attachmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  attachmentText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
