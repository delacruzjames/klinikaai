import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AvatarMenu } from '@/components/dashboard/avatar-menu';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

type DashboardHeaderProps = {
  title: string;
  onMenuPress: () => void;
  showMenuButton?: boolean;
};

export function DashboardHeader({ title, onMenuPress, showMenuButton = true }: DashboardHeaderProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'KA';

  return (
    <View style={[styles.header, { borderBottomColor: theme.backgroundSelected, backgroundColor: theme.background }]}>
      <View style={styles.left}>
        {showMenuButton ? (
          <Pressable
            onPress={onMenuPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityLabel="Toggle sidebar">
            <Ionicons name="menu-outline" size={22} color={theme.text} />
          </Pressable>
        ) : null}
        <ThemedText type="subtitle">{title}</ThemedText>
      </View>

      <View style={styles.right}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          <View style={styles.notificationDot} />
        </Pressable>

        <Pressable
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          accessibilityLabel="Account menu">
          <ThemedText type="smallBold" style={styles.avatarText}>
            {initials}
          </ThemedText>
        </Pressable>
      </View>

      <AvatarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5484d',
  },
  pressed: {
    opacity: 0.75,
  },
});
