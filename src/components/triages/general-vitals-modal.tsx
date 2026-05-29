import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type KeyboardEvent,
  type TextInput as TextInputType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import {
  GENERAL_VITALS_FIELDS,
  emptyGeneralVitalsForm,
  type GeneralVitalsFieldKey,
  type GeneralVitalsFormValues,
} from '@/constants/general-vitals-fields';
import { Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import type { TriageVisit } from '@/services/triages-api';
import { formatTriageAge } from '@/utils/format-triage';

import { TriageAccent } from './triages-toolbar';

type GeneralVitalsModalProps = {
  visible: boolean;
  visit: TriageVisit | null;
  onClose: () => void;
  onSubmit: (formData: GeneralVitalsFormValues) => Promise<void>;
};

type FocusableFieldKey = GeneralVitalsFieldKey | 'chief_complaint';

function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function GeneralVitalsModal({
  visible,
  visit,
  onClose,
  onSubmit,
}: GeneralVitalsModalProps) {
  const theme = useTheme();
  const isTablet = useBreakpoint() !== 'mobile';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const fieldAnchorRefs = useRef<Partial<Record<FocusableFieldKey, View | null>>>({});
  const inputRefs = useRef<Partial<Record<FocusableFieldKey, TextInputType | null>>>({});

  const [form, setForm] = useState<GeneralVitalsFormValues>(emptyGeneralVitalsForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const cardWidth = isTablet ? Math.min(720, width - Spacing.five * 2) : width;

  const keyboardInset = useMemo(() => {
    if (keyboardHeight <= 0) return 0;
    return Math.max(0, keyboardHeight - insets.bottom);
  }, [keyboardHeight, insets.bottom]);

  const cardMaxHeight = useMemo(() => {
    const defaultMax = isTablet ? height * 0.88 : height * 0.94;
    if (keyboardInset <= 0) return defaultMax;
    const topGap = insets.top + Spacing.four;
    const available = height - keyboardInset - topGap;
    return Math.min(defaultMax, Math.max(available, height * 0.35));
  }, [height, isTablet, keyboardInset, insets.top]);

  const patientMeta = useMemo(() => {
    if (!visit) return null;
    const age = formatTriageAge(visit.patient.age);
    return {
      name: visit.patient.fullname,
      initials: patientInitials(visit.patient.fullname),
      subtitle: age !== 'N/A' ? `Age ${age}` : null,
    };
  }, [visit]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };
    const onHide = () => setKeyboardHeight(0);

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setForm(emptyGeneralVitalsForm());
      setError(null);
      setSaving(false);
    }
  }, [visible, visit?.id]);

  const scrollToField = useCallback((key: FocusableFieldKey) => {
    const anchor = fieldAnchorRefs.current[key];
    const content = scrollContentRef.current;
    if (!anchor || !content || !scrollRef.current) return;

    requestAnimationFrame(() => {
      anchor.measureLayout(
        content,
        (_x, y) => {
          const visiblePadding = 72;
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - visiblePadding),
            animated: true,
          });
        },
        () => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      );
    });
  }, []);

  const focusNextField = useCallback((current: FocusableFieldKey) => {
    const order: FocusableFieldKey[] = [
      ...GENERAL_VITALS_FIELDS.map(f => f.key),
      'chief_complaint',
    ];
    const index = order.indexOf(current);
    const next = order[index + 1];
    if (next) {
      inputRefs.current[next]?.focus();
    } else {
      Keyboard.dismiss();
    }
  }, []);

  const updateField = (key: keyof GeneralVitalsFormValues, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = async () => {
    if (!visit) return;

    Keyboard.dismiss();
    setSaving(true);
    setError(null);

    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vitals.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.backgroundSelected,
    },
  ];

  const registerFieldAnchor = (key: FocusableFieldKey) => (node: View | null) => {
    fieldAnchorRefs.current[key] = node;
  };

  return (
    <Modal
      visible={visible}
      animationType={isTablet ? 'fade' : 'slide'}
      transparent
      onRequestClose={handleClose}>
      <View
        style={[
          styles.overlay,
          isTablet && styles.overlayTablet,
          keyboardInset > 0 && { paddingBottom: keyboardInset },
        ]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          disabled={saving}
          accessibilityLabel="Close modal"
        />

        <View
          style={[
            styles.card,
            modalShadow,
            {
              backgroundColor: theme.background,
              borderColor: theme.backgroundSelected,
              width: cardWidth,
              maxHeight: cardMaxHeight,
              paddingBottom:
                keyboardInset > 0 ? Spacing.two : Math.max(insets.bottom, Spacing.two),
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
              <View style={[styles.headerIcon, { backgroundColor: TriageAccent.muted }]}>
                <Ionicons name="fitness-outline" size={20} color={TriageAccent.main} />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={styles.title}>General vitals</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Record measurements & chief complaint
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              disabled={saving}
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

          {patientMeta ? (
            <View
              style={[
                styles.hero,
                {
                  backgroundColor: TriageAccent.muted,
                  borderBottomColor: theme.backgroundSelected,
                },
              ]}>
              <View style={[styles.heroAvatar, { backgroundColor: TriageAccent.main }]}>
                <ThemedText style={styles.heroAvatarText}>{patientMeta.initials}</ThemedText>
              </View>
              <View style={styles.heroText}>
                <ThemedText type="smallBold" style={styles.heroName} numberOfLines={2}>
                  {patientMeta.name}
                </ThemedText>
                {patientMeta.subtitle ? (
                  <ThemedText type="small" style={{ color: TriageAccent.main }}>
                    {patientMeta.subtitle}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          ) : null}

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && styles.scrollContentTablet,
              keyboardInset > 0 && { paddingBottom: Spacing.four },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator={isTablet}>
            <View ref={scrollContentRef} collapsable={false}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#b91c1c" />
                  <ThemedText type="small" style={styles.errorText}>
                    {error}
                  </ThemedText>
                </View>
              ) : null}

              <View
                style={[
                  styles.section,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="pulse-outline" size={16} color={TriageAccent.main} />
                  <ThemedText style={[styles.sectionTitle, { color: TriageAccent.main }]}>
                    Vital signs
                  </ThemedText>
                </View>
                <View style={[styles.fieldGrid, isTablet && styles.fieldGridTablet]}>
                  {GENERAL_VITALS_FIELDS.map((field, index) => {
                    const isLastVital = index === GENERAL_VITALS_FIELDS.length - 1;
                    return (
                      <View
                        key={field.key}
                        ref={registerFieldAnchor(field.key)}
                        collapsable={false}
                        style={[styles.fieldWrap, isTablet && styles.fieldWrapTablet]}>
                        <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                          {field.label}
                        </ThemedText>
                        <TextInput
                          ref={node => {
                            inputRefs.current[field.key] = node;
                          }}
                          value={form[field.key]}
                          onChangeText={value => updateField(field.key, value)}
                          onFocus={() => scrollToField(field.key)}
                          onSubmitEditing={() => focusNextField(field.key)}
                          placeholder={field.placeholder ?? '—'}
                          placeholderTextColor={theme.textSecondary}
                          keyboardType={field.keyboardType}
                          returnKeyType={isLastVital ? 'next' : 'next'}
                          blurOnSubmit={false}
                          editable={!saving}
                          style={[
                            ...inputStyle,
                            {
                              backgroundColor: theme.background,
                              borderColor: theme.backgroundSelected,
                            },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              <View
                ref={registerFieldAnchor('chief_complaint')}
                collapsable={false}
                style={styles.complaintSection}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={TriageAccent.main} />
                  <ThemedText style={[styles.sectionTitle, { color: TriageAccent.main }]}>
                    Chief complaint
                  </ThemedText>
                </View>
                <TextInput
                  ref={node => {
                    inputRefs.current.chief_complaint = node;
                  }}
                  value={form.chief_complaint}
                  onChangeText={value => updateField('chief_complaint', value)}
                  onFocus={() => scrollToField('chief_complaint')}
                  placeholder="Enter patient's chief complaint…"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  textAlignVertical="top"
                  editable={!saving}
                  style={[
                    styles.textArea,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.backgroundSelected,
                paddingBottom: keyboardInset > 0 ? Spacing.two : Spacing.two,
              },
              isTablet ? styles.footerTablet : styles.footerMobile,
            ]}>
            <Pressable
              onPress={handleClose}
              disabled={saving}
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
              onPress={handleSubmit}
              disabled={saving}
              style={({ pressed }) => [
                styles.submitBtn,
                isTablet ? styles.footerBtnTablet : styles.footerBtnMobile,
                { backgroundColor: TriageAccent.main },
                pressed && styles.pressed,
                saving && styles.submitBtnDisabled,
              ]}
              accessibilityRole="button">
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <ThemedText type="smallBold" style={styles.submitBtnText}>
                    Complete triage
                  </ThemedText>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  android: { elevation: 12 },
  default: PatientUI.cardShadow,
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
      android: { elevation: 16 },
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
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  heroText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  heroName: {
    fontSize: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.two,
  },
  scrollContentTablet: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    marginBottom: Spacing.four,
  },
  errorText: {
    flex: 1,
    color: '#b91c1c',
    lineHeight: 20,
  },
  section: {
    borderRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGrid: {
    gap: Spacing.three,
  },
  fieldGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: '4%',
    rowGap: Spacing.three,
  },
  fieldWrap: {
    gap: Spacing.one,
  },
  fieldWrapTablet: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    lineHeight: 15,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    minHeight: 48,
  },
  complaintSection: {
    gap: Spacing.two,
  },
  textArea: {
    minHeight: 112,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerMobile: {
    paddingHorizontal: Spacing.four,
  },
  footerTablet: {
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.five,
  },
  footerBtnMobile: {
    flex: 1,
  },
  footerBtnTablet: {
    minWidth: 120,
    paddingHorizontal: Spacing.five,
  },
  cancelBtn: {
    paddingVertical: Spacing.two,
    borderRadius: PatientUI.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelBtnText: {
    color: '#dc2626',
    letterSpacing: 0.3,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 14,
    minHeight: 48,
  },
  submitBtnDisabled: {
    opacity: 0.85,
  },
  submitBtnText: {
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.88,
  },
});
