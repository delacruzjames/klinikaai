import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AvatarMenu } from '@/components/dashboard/avatar-menu';
import { UserAvatar } from '@/components/dashboard/user-avatar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

type DashboardHeaderProps = {
  title: string;
  onMenuPress: () => void;
  showMenuButton?: boolean;
};

export function DashboardHeader({ title, onMenuPress, showMenuButton = true }: DashboardHeaderProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.fullname?.trim() || user?.email || 'User';
  const role = user?.role?.trim();

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
          style={({ pressed }) => [styles.accountButton, pressed && styles.pressed]}
          accessibilityLabel="Account menu">
          <UserAvatar
            fullname={user?.fullname}
            email={user?.email}
            firstName={user?.firstName}
            lastName={user?.lastName}
            profilePictureUrl={user?.profilePictureUrl}
            size={36}
          />
          <View style={[styles.accountText, isMobile && styles.accountTextMobile]}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.accountName}>
              {displayName}
            </ThemedText>
            {!isMobile && role ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.accountRole}>
                {role}
              </ThemedText>
            ) : null}
          </View>
          <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
        </Pressable>
      </View>

      <AvatarMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
    minWidth: 0,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 0,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: 220,
    paddingLeft: 2,
    paddingRight: 4,
    borderRadius: 999,
  },
  accountText: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 140,
  },
  accountTextMobile: {
    maxWidth: 96,
  },
  accountName: {
    lineHeight: 16,
  },
  accountRole: {
    marginTop: 1,
    lineHeight: 14,
    textTransform: 'capitalize',
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
