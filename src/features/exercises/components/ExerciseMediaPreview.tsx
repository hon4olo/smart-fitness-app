import { useMemo } from 'react';
import { StyleSheet, Text, View, type ImageResizeMode, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

import type { Exercise } from '../types';

type ExerciseMediaPreviewProps = {
  colors: typeof Colors.light;
  contentFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  exercise: Exercise;
  imageStyle?: StyleProp<ViewStyle>;
  onMediaError?: (error?: string) => void;
  onMediaLoad?: () => void;
  onMediaDisplay?: () => void;
  onMediaLoadStart?: () => void;
  playing?: boolean;
  priority?: 'low' | 'normal' | 'high' | null;
  resizeMode?: ImageResizeMode;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ExerciseMediaPreview({ colors, showLabel = false, style }: ExerciseMediaPreviewProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.frame, style]}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>MEDIA</Text>
        {showLabel ? <Text style={styles.placeholderText}>Media disabled for this runtime</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    frame: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderCurve: 'continuous',
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    placeholder: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      gap: Spacing.one,
      justifyContent: 'center',
      padding: Spacing.two,
    },
    placeholderIcon: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '900',
      lineHeight: 14,
      textAlign: 'center',
    },
    placeholderText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 18,
      textAlign: 'center',
    },
  });
