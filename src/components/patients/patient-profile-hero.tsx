import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientAvatar } from '@/components/patients/patient-avatar';
import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { PatientDetail } from '@/services/patients-api';

type PatientProfileHeroProps = {
  patient: PatientDetail;
};

type MetaChip = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function hasValue(value?: string | null): value is string {
  const trimmed = value?.trim();
  return Boolean(trimmed && trimmed !== 'N/A');
}

function MetaChipPill({ icon, label }: Pick<MetaChip, 'icon' | 'label'>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <Ionicons name={icon} size={13} color={Brand.primary} />
      <ThemedText type="small" numberOfLines={1} style={styles.chipText}>
        {label}
      </ThemedText>
    </View>
  );
}

function ContactPill({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.contactPill,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <View style={styles.contactIconWrap}>
        <Ionicons name={icon} size={14} color={Brand.primary} />
      </View>
      <ThemedText type="small" numberOfLines={1} style={styles.contactText}>
        {label}
      </ThemedText>
    </View>
  );
}

export function PatientProfileHero({ patient }: PatientProfileHeroProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const subtitleParts = [patient.age, patient.gender].filter(hasValue);
  const subtitle = subtitleParts.join(' · ');

  const metaChips: MetaChip[] = [];
  if (hasValue(patient.blood_type)) {
    metaChips.push({ key: 'blood', icon: 'water-outline', label: patient.blood_type });
  }
  if (hasValue(patient.doctor_name)) {
    metaChips.push({ key: 'doctor', icon: 'medkit-outline', label: patient.doctor_name });
  }
  if (hasValue(patient.civil_status)) {
    metaChips.push({ key: 'civil', icon: 'heart-outline', label: patient.civil_status });
  }
  if (hasValue(patient.occupation)) {
    metaChips.push({ key: 'occupation', icon: 'briefcase-outline', label: patient.occupation });
  }

  const phone = hasValue(patient.tel_or_mobile)
    ? patient.tel_or_mobile
    : hasValue(patient.mobile_number)
      ? patient.mobile_number
      : hasValue(patient.tel_no)
        ? patient.tel_no
        : null;

  const email = hasValue(patient.email) ? patient.email : null;

  return (
    <View
      style={[
        styles.card,
        PatientUI.cardShadow,
        {
          backgroundColor: theme.background,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <View
        style={[
          styles.banner,
          { backgroundColor: isDark ? '#0f4c81' : Brand.primary },
        ]}>
        <View style={[styles.bannerOrb, styles.bannerOrbLarge, { opacity: isDark ? 0.18 : 0.14 }]} />
        <View style={[styles.bannerOrb, styles.bannerOrbSmall, { opacity: isDark ? 0.22 : 0.18 }]} />
        <View style={[styles.bannerOrb, styles.bannerOrbAccent, { opacity: isDark ? 0.12 : 0.1 }]} />
      </View>

      <View style={styles.body}>
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatarRing,
              {
                backgroundColor: theme.background,
                borderColor: theme.backgroundSelected,
              },
            ]}>
            <PatientAvatar
              fullname={patient.fullname}
              firstName={patient.first_name}
              lastName={patient.last_name}
              avatarUrl={patient.avatar_url}
              size={84}
            />
          </View>
        </View>

        <View style={styles.identity}>
          <ThemedText style={styles.name} numberOfLines={2}>
            {patient.fullname}
          </ThemedText>
          {hasValue(patient.nickname) ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.nickname}>
              “{patient.nickname}”
            </ThemedText>
          ) : null}
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>

        {metaChips.length > 0 ? (
          <View style={styles.chipsRow}>
            {metaChips.map(chip => (
              <MetaChipPill key={chip.key} icon={chip.icon} label={chip.label} />
            ))}
          </View>
        ) : null}

        {phone || email ? (
          <View style={styles.contactRow}>
            {phone ? <ContactPill icon="call-outline" label={phone} /> : null}
            {email ? <ContactPill icon="mail-outline" label={email} /> : null}
          </View>
        ) : null}

        {hasValue(patient.date_created) ? (
          <View style={styles.footerMeta}>
            <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Patient since {patient.date_created}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: PatientUI.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  banner: {
    height: 96,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerOrb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  bannerOrbLarge: {
    width: 160,
    height: 160,
    top: -72,
    right: -24,
  },
  bannerOrbSmall: {
    width: 88,
    height: 88,
    bottom: -36,
    left: -18,
  },
  bannerOrbAccent: {
    width: 56,
    height: 56,
    top: 18,
    left: '42%',
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  avatarWrap: {
    marginTop: -42,
    marginBottom: Spacing.two,
  },
  avatarRing: {
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: 999,
    borderWidth: 3,
  },
  identity: {
    gap: 4,
    marginBottom: Spacing.three,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  nickname: {
    fontStyle: 'italic',
  },
  subtitle: {
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 6,
    borderRadius: PatientUI.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  chipText: {
    flexShrink: 1,
  },
  contactRow: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contactIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    color: Brand.primary,
    fontWeight: '600',
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.one,
  },
});
