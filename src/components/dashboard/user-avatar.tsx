import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { getPatientInitials } from '@/utils/patient-initials';

type UserAvatarProps = {
  fullname?: string | null;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string | null;
  size?: number;
};

export function UserAvatar({
  fullname,
  email,
  firstName,
  lastName,
  profilePictureUrl,
  size = 36,
}: UserAvatarProps) {
  const displayName = fullname?.trim() || email?.trim() || 'User';
  const initials = getPatientInitials(displayName, firstName, lastName);
  const fontSize = Math.max(11, Math.round(size * 0.34));

  if (profilePictureUrl?.trim()) {
    return (
      <Image
        source={{ uri: profilePictureUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        accessibilityLabel={`${displayName} avatar`}
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
      accessibilityLabel={`${displayName}, ${initials}`}>
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
