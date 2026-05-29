import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';

type PaginationControlsProps = {
  totalRecords: number;
  currentPage: number;
  perPage: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function PaginationControls({
  totalRecords,
  currentPage,
  perPage,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  const theme = useTheme();
  const isTablet = useBreakpoint() !== 'mobile';

  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const rangeStart = totalRecords === 0 ? 0 : (safePage - 1) * perPage + 1;
  const rangeEnd = Math.min(safePage * perPage, totalRecords);

  const goTo = (page: number) => {
    if (disabled) return;
    onPageChange(Math.max(1, Math.min(page, totalPages)));
  };

  if (totalRecords === 0) return null;

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <View
      style={[
        styles.wrapper,
        PatientUI.cardShadowLight,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
        },
        isTablet && styles.wrapperTablet,
      ]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.summary}>
        Showing {rangeStart}–{rangeEnd} of {totalRecords}
      </ThemedText>

      <View style={styles.controls}>
        <Pressable
          onPress={() => goTo(safePage - 1)}
          disabled={disabled || !canPrev}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            (!canPrev || disabled) && styles.navBtnDisabled,
            pressed && canPrev && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Previous page">
          <Ionicons
            name="chevron-back"
            size={18}
            color={canPrev && !disabled ? theme.text : theme.textSecondary}
          />
        </Pressable>

        <View style={[styles.pagePill, { backgroundColor: Brand.primaryMuted }]}>
          <ThemedText type="smallBold" style={styles.pagePillText}>
            {safePage} / {totalPages}
          </ThemedText>
        </View>

        <Pressable
          onPress={() => goTo(safePage + 1)}
          disabled={disabled || !canNext}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            (!canNext || disabled) && styles.navBtnDisabled,
            pressed && canNext && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next page">
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canNext && !disabled ? theme.text : theme.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  wrapperTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  summary: {
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.45,
  },
  pagePill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    minWidth: 72,
    alignItems: 'center',
  },
  pagePillText: {
    color: Brand.primary,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
