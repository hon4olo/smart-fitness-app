import { useEffect, useMemo, useState } from 'react';
import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View, type ImageResizeMode, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

import type { Exercise } from '../types';
import { getExerciseMediaUri } from '../media';

type ExerciseMediaPreviewProps = {
  colors: typeof Colors.light;
  exercise: Exercise;
  imageStyle?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  onMediaError?: (error?: string) => void;
  onMediaLoad?: () => void;
  onMediaDisplay?: () => void;
  onMediaLoadStart?: () => void;
  playing?: boolean;
  resizeMode?: ImageResizeMode;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ExerciseMediaPreview({
  colors,
  contentFit,
  exercise,
  imageStyle,
  onMediaDisplay,
  onMediaError,
  onMediaLoad,
  onMediaLoadStart,
  playing = true,
  resizeMode = 'cover',
  showLabel = false,
  style,
}: ExerciseMediaPreviewProps) {
  const [loading, setLoading] = useState(Boolean(getExerciseMediaUri(exercise, { playing })));
  const [mediaFailed, setMediaFailed] = useState(false);
  const mediaUri = !mediaFailed ? getExerciseMediaUri(exercise, { playing }) : undefined;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const resolvedContentFit = contentFit ?? (resizeMode === 'contain' || resizeMode === 'center' ? 'contain' : 'cover');

  useEffect(() => {
    const nextMediaUri = getExerciseMediaUri(exercise, { playing });
    setLoading(Boolean(nextMediaUri));
    setMediaFailed(false);
  }, [exercise, playing]);

  return (
    <View style={[styles.frame, style]}>
      {mediaUri ? (
        <Image
          accessibilityLabel={`${exercise.name} exercise media`}
          autoplay={playing}
          cachePolicy="memory-disk"
          contentFit={resolvedContentFit}
          onError={(event) => {
            setLoading(false);
            setMediaFailed(true);
            onMediaError?.(event.error);
          }}
          onDisplay={onMediaDisplay}
          onLoad={() => {
            onMediaLoad?.();
          }}
          onLoadEnd={() => setLoading(false)}
          onLoadStart={() => {
            onMediaLoadStart?.();
          }}
          recyclingKey={`${exercise.id}:${mediaUri}:${playing ? 'playing' : 'paused'}`}
          source={{ uri: mediaUri }}
          style={[styles.image, imageStyle]}
        />
      ) : null}

      {loading && mediaUri ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {!mediaUri ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>▰</Text>
          {showLabel ? <Text style={styles.placeholderText}>No media available</Text> : null}
        </View>
      ) : null}
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
    image: {
      height: '100%',
      width: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      backgroundColor: colors.surfaceSecondary,
      justifyContent: 'center',
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
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 24,
    },
    placeholderText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 18,
      textAlign: 'center',
    },
  });
