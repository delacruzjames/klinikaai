import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
  PATIENT_DETAIL_TABS,
  PatientDetailTabs,
  type PatientDetailTabKey,
} from '@/components/patients/patient-detail-tabs';
import { PatientDetailsTab } from '@/components/patients/patient-details-tab';
import { PatientProfileHero } from '@/components/patients/patient-profile-hero';
import { PatientTabPlaceholder } from '@/components/patients/patient-tab-placeholder';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PatientDetail } from '@/services/patients-api';

type PatientDetailViewProps = {
  patient: PatientDetail;
};

export function PatientDetailView({ patient }: PatientDetailViewProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<PatientDetailTabKey>('details');

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
          <PatientDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        {activeTab === 'details' ? (
          <PatientDetailsTab
            patient={patient}
            onEdit={() => Alert.alert('Edit', 'Patient editing will be available soon.')}
            onTriage={() => Alert.alert('Triage', 'Triage will be available soon.')}
            onDownloadPdf={() => Alert.alert('Download', 'PDF download will be available soon.')}
          />
        ) : (
          <PatientTabPlaceholder title={activeLabel} />
        )}
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
