import { Platform, type ViewStyle } from 'react-native';

export const PatientUI = {
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },
  cardShadow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: { elevation: 2 },
    default: {},
  }),
  cardShadowLight: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
    android: { elevation: 1 },
    default: {},
  }),
} as const;
