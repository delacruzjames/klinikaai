import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
  PATIENT_DETAIL_TABS,
  PatientDetailTabs,
  type PatientDetailTabKey,
} from '@/components/patients/patient-detail-tabs';
import { PatientDetailsTab } from '@/components/patients/patient-details-tab';
import { PatientProfileHero } from '@/components/patients/patient-profile-hero';
import { PatientTabPlaceholder } from '@/components/patients/patient-tab-placeholder';
import { PatientGrowthTab } from '@/components/patients/patient-growth-tab';
import { PatientConsultationsTab } from '@/components/patients/patient-consultations-tab';
import { PatientMedicalHistoryTab } from '@/components/patients/patient-medical-history-tab';
import { PatientVitalsTab } from '@/components/patients/patient-vitals-tab';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PatientDetail } from '@/services/patients-api';

function parsePatientTab(value: string | undefined): PatientDetailTabKey {
  if (value && PATIENT_DETAIL_TABS.some(tab => tab.key === value)) {
    return value as PatientDetailTabKey;
  }
  return 'details';
}

function parseConsultationId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

type PatientDetailViewProps = {
  patient: PatientDetail;
  initialTab?: string;
  initialConsultationId?: string;
};

export function PatientDetailView({
  patient,
  initialTab,
  initialConsultationId,
}: PatientDetailViewProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<PatientDetailTabKey>(() =>
    parsePatientTab(initialTab)
  );
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | null>(() =>
    parseConsultationId(initialConsultationId)
  );

  const handleTabChange = (tab: PatientDetailTabKey) => {
    setActiveTab(tab);
    if (tab !== 'consultations') {
      setSelectedConsultationId(null);
    }
  };

  const handleSelectConsultation = (consultationId: number | null) => {
    setSelectedConsultationId(consultationId);
    if (consultationId != null) {
      setActiveTab('consultations');
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(parsePatientTab(initialTab));
    }
    if (initialConsultationId !== undefined) {
      const parsed = parseConsultationId(initialConsultationId);
      setSelectedConsultationId(parsed);
      if (parsed != null) {
        setActiveTab('consultations');
      }
    }
  }, [initialTab, initialConsultationId]);

  const activeLabel =
    PATIENT_DETAIL_TABS.find(tab => tab.key === activeTab)?.label ?? 'Section';

  return (
    <View style={[styles.root, { backgroundColor: theme.backgroundElement }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}>
        <PatientProfileHero patient={patient} />

        <View style={{ backgroundColor: theme.backgroundElement }}>
          <PatientDetailTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </View>

        {activeTab === 'details' ? (
          <PatientDetailsTab
            patient={patient}
            onEdit={() => Alert.alert('Edit', 'Patient editing will be available soon.')}
            onTriage={() => Alert.alert('Triage', 'Triage will be available soon.')}
            onDownloadPdf={() => Alert.alert('Download', 'PDF download will be available soon.')}
          />
        ) : null}

        {activeTab === 'vitals' ? (
          <PatientVitalsTab patientId={patient.id} isActive={activeTab === 'vitals'} />
        ) : null}

        {activeTab === 'growth-chart' ? (
          <PatientGrowthTab patientId={patient.id} isActive={activeTab === 'growth-chart'} />
        ) : null}

        {activeTab === 'medical-history' ? (
          <PatientMedicalHistoryTab
            patientId={patient.id}
            isActive={activeTab === 'medical-history'}
          />
        ) : null}

        {activeTab === 'consultations' ? (
          <PatientConsultationsTab
            patient={patient}
            patientId={patient.id}
            isActive={activeTab === 'consultations'}
            selectedConsultationId={selectedConsultationId}
            onSelectConsultation={handleSelectConsultation}
          />
        ) : null}

        {activeTab !== 'details' &&
        activeTab !== 'vitals' &&
        activeTab !== 'growth-chart' &&
        activeTab !== 'medical-history' &&
        activeTab !== 'consultations' ? (
          <PatientTabPlaceholder title={activeLabel} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.six,
  },
});
