import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { UserAvatar } from '@/components/dashboard/user-avatar';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

type AvatarMenuProps = {
  visible: boolean;
  onClose: () => void;
};

type MenuItem = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export function AvatarMenu({ visible, onClose }: AvatarMenuProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user, signOut, lockScreen } = useAuth();

  const displayName = user?.fullname?.trim() || user?.email || 'User';
  const role = user?.role?.trim();

  const run = (action: () => void) => {
    onClose();
    action();
  };

  const items: MenuItem[] = [
    {
      label: 'Profile',
      onPress: () => router.push('/profile'),
    },
    {
      label: 'Update Password',
      onPress: () => router.push('/update-password'),
    },
    {
      label: 'Lock Screen',
      onPress: () => lockScreen(),
    },
    {
      label: 'Sign Out',
      destructive: true,
      onPress: async () => {
        await signOut();
        router.replace('/');
      },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.menu, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
          <View style={[styles.profileHeader, { borderBottomColor: theme.backgroundSelected }]}>
            <UserAvatar
              fullname={user?.fullname}
              email={user?.email}
              firstName={user?.firstName}
              lastName={user?.lastName}
              profilePictureUrl={user?.profilePictureUrl}
              size={44}
            />
            <View style={styles.profileText}>
              <ThemedText type="smallBold" numberOfLines={2}>
                {displayName}
              </ThemedText>
              {role ? (
                <View style={[styles.roleBadge, { backgroundColor: Brand.primaryMuted }]}>
                  <ThemedText type="small" style={styles.roleText}>
                    {role}
                  </ThemedText>
                </View>
              ) : null}
              {user?.email ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {user.email}
                </ThemedText>
              ) : null}
            </View>
          </View>

          {items.map(item => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => run(item.onPress)}>
              <ThemedText type="small" style={item.destructive ? styles.destructive : undefined}>
                {item.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: Spacing.three,
  },
  menu: {
    minWidth: 240,
    borderRadius: Spacing.two,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  roleText: {
    color: Brand.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  menuItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  destructive: {
    color: '#c81e1e',
  },
});
