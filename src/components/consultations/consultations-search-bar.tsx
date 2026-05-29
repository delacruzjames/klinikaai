import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PatientUI } from '@/components/patients/patient-ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ConsultationsSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function ConsultationsSearchBar({ value, onChangeText }: ConsultationsSearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        PatientUI.cardShadowLight,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
      ]}>
      <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="Search complaints, findings, medication…"
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button">
          <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: PatientUI.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    minHeight: 22,
  },
});
