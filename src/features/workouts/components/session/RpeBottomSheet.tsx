import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import type { WorkoutRpe } from '@/types';
import { useAppTheme } from '@/theme/AppThemeProvider';

export const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

type RpeBottomSheetProps = {
  selectedRpe?: WorkoutRpe;
  setLabel: string;
  visible: boolean;
  onDismiss: () => void;
  onSelect: (value: WorkoutRpe) => void;
  onSkip: () => void;
};

const getRpeHelper = (value?: WorkoutRpe) => {
  switch (value) {
    case 6:
      return '≈ 4+ reps in reserve';
    case 7:
      return '≈ 3 RIR';
    case 8:
      return '≈ 2 RIR';
    case 9:
      return '≈ 1 RIR';
    case 10:
      return 'Failure';
    default:
      return value ? 'Rate effort between reserve markers' : 'Select how hard this set felt';
  }
};

export function RpeBottomSheet({ selectedRpe, setLabel, visible, onDismiss, onSelect, onSkip }: RpeBottomSheetProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateY = useRef(new Animated.Value(220)).current;
  const [localSelection, setLocalSelection] = useState(selectedRpe);

  useEffect(() => {
    if (visible) {
      setLocalSelection(selectedRpe);
      translateY.setValue(220);
      Animated.spring(translateY, {
        damping: 24,
        mass: 0.9,
        stiffness: 260,
        toValue: 0,
        useNativeDriver: true,
      }).start();
      return;
    }

    translateY.setValue(220);
  }, [selectedRpe, translateY, visible]);

  const dismissWithAnimation = (afterDismiss?: () => void) => {
    Animated.timing(translateY, {
      duration: 220,
      toValue: 220,
      useNativeDriver: true,
    }).start(() => {
      afterDismiss?.();
      onDismiss();
    });
  };

  const chooseRpe = (value: WorkoutRpe) => {
    setLocalSelection(value);
    onSelect(value);
    setTimeout(() => dismissWithAnimation(), 120);
  };

  const helperRpe = localSelection ?? selectedRpe;

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Dismiss RPE selector" onPress={() => dismissWithAnimation()} style={styles.scrim} />
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.two, transform: [{ translateY }] }]}>
          <Text style={styles.title}>RPE for {setLabel}</Text>
          <View style={styles.values}>
            {RPE_VALUES.map((value) => {
              const selected = helperRpe === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={value}
                  onPress={() => chooseRpe(value)}
                  style={({ pressed }) => [styles.valueButton, selected && styles.valueButtonSelected, pressed && styles.pressed]}>
                  <Text style={[styles.valueLabel, selected && styles.valueLabelSelected]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.helper}>
            <Text style={styles.helperTitle}>{helperRpe ? `RPE ${helperRpe}` : 'RPE'}</Text>
            <Text style={styles.helperText}>{getRpeHelper(helperRpe)}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => dismissWithAnimation(onSkip)} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
    },
    helper: {
      alignItems: 'center',
      minHeight: 38,
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
    },
    helperTitle: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 18,
    },
    pressed: {
      opacity: 0.72,
    },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.28)',
    },
    sheet: {
      backgroundColor: colors.surfacePrimary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      gap: 8,
      minHeight: 178,
      paddingHorizontal: Spacing.two,
      paddingTop: 12,
    },
    skipButton: {
      alignItems: 'center',
      alignSelf: 'center',
      minHeight: 30,
      justifyContent: 'center',
      paddingHorizontal: Spacing.three,
    },
    skipLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 22,
      textAlign: 'center',
    },
    valueButton: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      borderCurve: 'continuous',
      borderRadius: 11,
      flex: 1,
      height: 36,
      justifyContent: 'center',
    },
    valueButtonSelected: {
      backgroundColor: colors.accent,
    },
    valueLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
      fontWeight: '800',
    },
    valueLabelSelected: {
      color: colors.textOnAccent,
    },
    values: {
      flexDirection: 'row',
      gap: 5,
    },
  });
