import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

const DIRECT_GIF_URL = 'https://static.exercisedb.dev/media/EIeI8Vf.gif';

export default function DirectExerciseGifTestRoute() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [displayed, setDisplayed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.headerControl}>
            <Text style={styles.headerControlText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Direct physical-device GIF test</Text>
        </View>

        <View style={styles.mediaFrame}>
          <Image
            accessibilityLabel="Direct ExerciseDB GIF test"
            autoplay
            cachePolicy="disk"
            contentFit="contain"
            onDisplay={() => {
              setDisplayed(true);
            }}
            onError={(event) => {
              setStatus('failed');
              setError(event.error);
            }}
            onLoad={() => {
              setStatus('loaded');
              setError(null);
            }}
            onLoadEnd={() => {
              setStatus((current) => (current === 'loading' ? 'loaded' : current));
            }}
            onLoadStart={() => {
              setStatus('loading');
              setDisplayed(false);
              setError(null);
            }}
            recyclingKey={`direct-gif-test:${DIRECT_GIF_URL}`}
            source={{ uri: DIRECT_GIF_URL }}
            style={styles.image}
          />
          {status === 'loading' ? (
            <View style={styles.overlay}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null}
        </View>

        <View style={styles.diagnostics}>
          <Text selectable style={styles.diagnosticText}>url: {DIRECT_GIF_URL}</Text>
          <Text selectable style={styles.diagnosticText}>status: {status}</Text>
          <Text selectable style={styles.diagnosticText}>displayed: {displayed ? 'true' : 'false'}</Text>
          <Text selectable style={styles.diagnosticText}>error: {error ?? 'none'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  diagnosticText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  diagnostics: {
    backgroundColor: Colors.dark.surfacePrimary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  headerControl: {
    alignItems: 'center',
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 64,
    paddingHorizontal: Spacing.three,
  },
  headerControlText: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  mediaFrame: {
    aspectRatio: 1.35,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderColor: Colors.dark.borderSubtle,
    borderRadius: Radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceSecondary,
    justifyContent: 'center',
  },
  screen: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  title: {
    color: Colors.dark.textPrimary,
    flex: 1,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    textAlign: 'center',
  },
});
