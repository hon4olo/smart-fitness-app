import { router } from 'expo-router';
import { History } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFloatingTabBarBottomClearance } from '@/components/navigation/floatingTabBarLayout';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import WorkoutsScreen from '@/features/workouts/screens/WorkoutsScreen';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

export default function WorkoutsRoute() {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const historyBottom = getFloatingTabBarBottomClearance(insets.bottom, Spacing.two);

  return (
    <View style={styles.screen}>
      <WorkoutsScreen />
      <Pressable
        accessibilityHint={t('workouts.historyHint')}
        accessibilityLabel={t('workouts.historyAccessibility')}
        accessibilityRole="button"
        onPress={() => router.push('/workout-history')}
        style={({ pressed }) => [
          styles.historyButton,
          { bottom: historyBottom },
          pressed && styles.pressed,
        ]}>
        <History color={colors.accent} size={18} strokeWidth={2.2} />
        <Text style={styles.historyLabel}>{t('workouts.history')}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    historyButton: {
      alignItems: 'center',
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: Spacing.one,
      left: Spacing.three,
      minHeight: 44,
      paddingHorizontal: Spacing.three,
      position: 'absolute',
      zIndex: 20,
    },
    historyLabel: {
      color: colors.textPrimary,
      fontSize: Typography.label.fontSize,
      fontWeight: '900',
      lineHeight: Typography.label.lineHeight,
    },
    pressed: {
      opacity: 0.68,
    },
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
  });