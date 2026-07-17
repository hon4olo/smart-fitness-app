import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type FinishWorkoutActionsProps = {
  onDiscard: () => void;
  onSave: () => void;
};

export const FinishWorkoutActions = memo(function FinishWorkoutActions({ onDiscard, onSave }: FinishWorkoutActionsProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.actions}>
      <AppButton label="Save" onPress={onSave} />
      <Pressable accessibilityRole="button" onPress={onDiscard} style={({ pressed }) => [styles.discardButton, pressed && styles.pressed]}>
        <Text style={styles.discardLabel}>Discard workout</Text>
      </Pressable>
    </View>
  );
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    actions: {
      gap: Spacing.one,
    },
    discardButton: {
      alignSelf: 'flex-start',
      paddingVertical: Spacing.one,
    },
    discardLabel: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '800',
    },
    pressed: {
      opacity: 0.72,
    },
  });
