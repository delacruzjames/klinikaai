import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import {
  MEDICAL_HISTORY_KINDS,
  MEDICAL_HISTORY_LABELS,
  MEDICAL_HISTORY_META,
  MEDICAL_HISTORY_SHORT_LABELS,
  emptyMedicalHistoryGrouped,
  type MedicalHistoryGrouped,
  type MedicalHistoryItem,
  type MedicalHistoryKind,
} from '@/constants/medical-history';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  createPatientMedicalHistory,
  deletePatientMedicalHistory,
  fetchPatientMedicalHistories,
  updatePatientMedicalHistory,
} from '@/services/patient-medical-history-api';

type PatientMedicalHistoryTabProps = {
  patientId: number;
  isActive: boolean;
};

type FormMode = 'create' | 'edit';

export function PatientMedicalHistoryTab({ patientId, isActive }: PatientMedicalHistoryTabProps) {
  const { token } = useAuth();
  const theme = useTheme();
  const [history, setHistory] = useState<MedicalHistoryGrouped>(emptyMedicalHistoryGrouped());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [formKind, setFormKind] = useState<MedicalHistoryKind>('past_medical_history');
  const [formNotes, setFormNotes] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const totalEntries = useMemo(
    () => MEDICAL_HISTORY_KINDS.reduce((sum, kind) => sum + history[kind].length, 0),
    [history]
  );

  const loadHistory = useCallback(
    async (mode: 'load' | 'refresh' = 'load') => {
      if (!token) {
        setError('You are not signed in.');
        return;
      }

      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await fetchPatientMedicalHistories(token, patientId);
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load medical history.');
        setHistory(emptyMedicalHistoryGrouped());
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId, token]
  );

  useEffect(() => {
    if (isActive) loadHistory();
  }, [isActive, loadHistory]);

  const openCreate = (kind?: MedicalHistoryKind) => {
    setFormMode('create');
    setFormKind(kind ?? 'past_medical_history');
    setFormNotes('');
    setEditId(null);
    setModalVisible(true);
  };

  const openEdit = (kind: MedicalHistoryKind, item: MedicalHistoryItem) => {
    setFormMode('edit');
    setFormKind(kind);
    setFormNotes(item.notes ?? '');
    setEditId(item.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!token) return;
    const notes = formNotes.trim();
    if (!notes) {
      Alert.alert('Notes required', 'Please enter history notes before saving.');
      return;
    }

    setSaving(true);
    try {
      if (formMode === 'create') {
        const created = await createPatientMedicalHistory(token, patientId, formKind, notes);
        setHistory(prev => ({
          ...prev,
          [created.kind]: [...prev[created.kind], created],
        }));
      } else if (editId != null) {
        const updated = await updatePatientMedicalHistory(token, patientId, editId, notes);
        setHistory(prev => ({
          ...prev,
          [formKind]: prev[formKind].map(item =>
            item.id === editId ? { ...item, notes: updated.notes } : item
          ),
        }));
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert(
        'Save failed',
        err instanceof Error ? err.message : 'Could not save medical history.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (kind: MedicalHistoryKind, id: number) => {
    Alert.alert('Delete entry', 'Remove this medical history entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deletePatientMedicalHistory(token, patientId, id);
            setHistory(prev => ({
              ...prev,
              [kind]: prev[kind].filter(item => item.id !== id),
            }));
          } catch (err) {
            Alert.alert(
              'Delete failed',
              err instanceof Error ? err.message : 'Could not delete entry.'
            );
          }
        },
      },
    ]);
  };

  if (loading && totalEntries === 0) {
    return (
      <HistoryPanel>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <ThemedText type="small" themeColor="textSecondary">
            Loading medical history…
          </ThemedText>
        </View>
      </HistoryPanel>
    );
  }

  if (error && totalEntries === 0) {
    return (
      <HistoryPanel>
        <View style={[styles.centered, styles.errorBox]}>
          <View style={[styles.stateIcon, { backgroundColor: Brand.primaryMuted }]}>
            <Ionicons name="cloud-offline-outline" size={28} color={Brand.primary} />
          </View>
          <ThemedText type="smallBold">Couldn&apos;t load medical history</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable
            onPress={() => loadHistory()}
            style={[styles.primaryBtn, { backgroundColor: Brand.primary }]}
            accessibilityRole="button">
            <ThemedText style={styles.primaryBtnText}>Try again</ThemedText>
          </Pressable>
        </View>
      </HistoryPanel>
    );
  }

  return (
    <HistoryPanel>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>Medical History</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Past medical, family, allergies, and procedures
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => loadHistory('refresh')}
            disabled={loading || refreshing}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Refresh medical history">
            {refreshing ? (
              <ActivityIndicator size="small" color={Brand.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={theme.text} />
            )}
          </Pressable>
          <Pressable
            onPress={() => openCreate()}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: Brand.primary },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create medical history">
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={[styles.inlineError, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
          <Pressable onPress={() => loadHistory()} accessibilityRole="button">
            <ThemedText type="linkPrimary">Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionsGrid}>
        {MEDICAL_HISTORY_KINDS.map(kind => (
          <View key={kind} style={styles.sectionWrap}>
            <HistorySection
              kind={kind}
              items={history[kind]}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAdd={() => openCreate(kind)}
            />
          </View>
        ))}
      </View>

      <MedicalHistoryFormModal
        visible={modalVisible}
        mode={formMode}
        kind={formKind}
        notes={formNotes}
        saving={saving}
        onKindChange={setFormKind}
        onNotesChange={setFormNotes}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </HistoryPanel>
  );
}

function HistoryPanel({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        PatientUI.cardShadow,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
      ]}>
      {children}
    </View>
  );
}

function HistorySection({
  kind,
  items,
  onEdit,
  onDelete,
  onAdd,
}: {
  kind: MedicalHistoryKind;
  items: MedicalHistoryItem[];
  onEdit: (kind: MedicalHistoryKind, item: MedicalHistoryItem) => void;
  onDelete: (kind: MedicalHistoryKind, id: number) => void;
  onAdd: () => void;
}) {
  const theme = useTheme();
  const meta = MEDICAL_HISTORY_META[kind];

  return (
    <View
      style={[
        styles.section,
        PatientUI.cardShadowLight,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIcon, { backgroundColor: `${meta.color}20` }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={styles.sectionTitleText}>
            <ThemedText type="smallBold" numberOfLines={2}>
              {MEDICAL_HISTORY_LABELS[kind]}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {items.length === 0
                ? 'No entries'
                : `${items.length} entr${items.length === 1 ? 'y' : 'ies'}`}
            </ThemedText>
          </View>
        </View>
        <Pressable
          onPress={onAdd}
          style={[styles.addChip, { backgroundColor: theme.background }]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${MEDICAL_HISTORY_LABELS[kind]}`}>
          <Ionicons name="add" size={18} color={Brand.primary} />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View style={[styles.sectionEmpty, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionEmptyText}>
            No history recorded
          </ThemedText>
          <Pressable onPress={onAdd} accessibilityRole="button">
            <ThemedText type="linkPrimary">Add entry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <View
          style={[
            styles.entriesList,
            { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
          ]}>
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.entryRow,
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.backgroundSelected,
                },
              ]}>
              <ThemedText type="small" style={styles.entryNotes}>
                {item.notes?.trim() || '—'}
              </ThemedText>
              <View style={styles.entryActions}>
                <Pressable
                  onPress={() => onEdit(kind, item)}
                  style={[styles.actionChip, { backgroundColor: theme.backgroundElement }]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit">
                  <Ionicons name="create-outline" size={16} color="#d97706" />
                </Pressable>
                <Pressable
                  onPress={() => onDelete(kind, item.id)}
                  style={[styles.actionChip, { backgroundColor: theme.backgroundElement }]}
                  accessibilityRole="button"
                  accessibilityLabel="Delete">
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MedicalHistoryFormModal({
  visible,
  mode,
  kind,
  notes,
  saving,
  onKindChange,
  onNotesChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  mode: FormMode;
  kind: MedicalHistoryKind;
  notes: string;
  saving: boolean;
  onKindChange: (kind: MedicalHistoryKind) => void;
  onNotesChange: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();
  const meta = MEDICAL_HISTORY_META[kind];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            PatientUI.cardShadow,
            { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
          ]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: `${meta.color}20` }]}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>
              <ThemedText type="smallBold" style={styles.modalTitle}>
                {mode === 'create' ? 'Create Medical History' : 'Edit Medical History'}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          {mode === 'create' ? (
            <View style={styles.kindPicker}>
              <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Category
              </ThemedText>
              <View style={styles.kindGrid}>
                {MEDICAL_HISTORY_KINDS.map(k => {
                  const kMeta = MEDICAL_HISTORY_META[k];
                  const selected = k === kind;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => onKindChange(k)}
                      style={[
                        styles.kindOption,
                        {
                          backgroundColor: selected ? Brand.primaryMuted : theme.backgroundElement,
                          borderColor: selected ? Brand.primary : theme.backgroundSelected,
                        },
                      ]}>
                      <Ionicons
                        name={kMeta.icon}
                        size={18}
                        color={selected ? Brand.primary : kMeta.color}
                      />
                      <ThemedText
                        type="small"
                        style={selected ? styles.kindOptionTextActive : undefined}
                        numberOfLines={2}>
                        {MEDICAL_HISTORY_SHORT_LABELS[k]}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.editKindBanner,
                { backgroundColor: Brand.primaryMuted, borderColor: `${Brand.primary}30` },
              ]}>
              <ThemedText type="smallBold" style={{ color: Brand.primary }}>
                {MEDICAL_HISTORY_LABELS[kind]}
              </ThemedText>
            </View>
          )}

          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>Notes</ThemedText>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Enter medical history notes…"
            placeholderTextColor={theme.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.notesInput,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}
          />

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              style={[styles.modalBtnOutline, { borderColor: theme.backgroundSelected }]}
              accessibilityRole="button">
              <ThemedText type="smallBold">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={[styles.modalBtnPrimary, { backgroundColor: Brand.primary }]}
              accessibilityRole="button">
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <ThemedText style={styles.modalBtnPrimaryText}>Save</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.three,
  },
  errorBox: {
    minHeight: 200,
    paddingHorizontal: Spacing.three,
  },
  errorText: {
    textAlign: 'center',
    maxWidth: 280,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: PatientUI.radius.md,
    marginTop: Spacing.two,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  panel: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.lg,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.md,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
  },
  sectionWrap: {
    width: '50%',
    padding: Spacing.one,
  },
  section: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitleText: {
    flex: 1,
    gap: 2,
  },
  addChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: PatientUI.radius.md,
    borderStyle: 'dashed',
  },
  sectionEmptyText: {
    fontStyle: 'italic',
  },
  entriesList: {
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  entryNotes: {
    flex: 1,
    lineHeight: 22,
    fontSize: 14,
  },
  entryActions: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexShrink: 0,
  },
  actionChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: PatientUI.radius.lg,
    borderTopRightRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modalTitle: {
    fontSize: 17,
    flex: 1,
  },
  kindPicker: {
    gap: Spacing.two,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  kindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  kindOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  kindOptionTextActive: {
    color: Brand.primary,
    fontWeight: '600',
  },
  editKindBanner: {
    padding: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notesInput: {
    minHeight: 120,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  modalBtnOutline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalBtnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: PatientUI.radius.md,
  },
  modalBtnPrimaryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
