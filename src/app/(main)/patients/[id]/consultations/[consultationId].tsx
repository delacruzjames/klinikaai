import { PatientDetailScreen } from '@/components/patients/patient-detail-screen';

/** Patient profile with Consults tab + {@link ConsultationDetailView} for this visit. */
export default function PatientConsultationDetailRoute() {
  return (
    <PatientDetailScreen initialTab="consultations" />
  );
}
