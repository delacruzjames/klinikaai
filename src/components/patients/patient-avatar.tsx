import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { getPatientInitials } from '@/utils/patient-initials';

type PatientAvatarProps = {
  fullname: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  size?: number;
};

export function PatientAvatar({
  fullname,
  firstName,
  lastName,
  avatarUrl,
  size = 40,
}: PatientAvatarProps) {
  const initials = getPatientInitials(fullname, firstName, lastName);
  const fontSize = Math.max(12, Math.round(size * 0.34));

  if (avatarUrl?.trim()) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: Brand.primaryMuted,
          },
        ]}
        accessibilityLabel={`${fullname} avatar`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityLabel={`${fullname}, ${initials}`}>
      <ThemedText style={[styles.initials, { fontSize }]}>{initials}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Brand.primaryMuted,
  },
  fallback: {
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
