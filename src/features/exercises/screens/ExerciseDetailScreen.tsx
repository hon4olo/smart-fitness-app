import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MetricCard } from '@/components/ui/MetricCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ProgressTrendChart } from '@/components/progress/ProgressTrendChart';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { useAppTheme } from '@/theme/AppThemeProvider';

import { MuscleMap } from '../components/MuscleMap';
import { ExerciseMediaPreview } from '../components/ExerciseMediaPreview';
import { loadFavoriteExerciseIds, saveFavoriteExerciseIds } from '../favoritesRepository';
import { selectCompletedSetsByExerciseId } from '../history';
import { buildMuscleHighlights } from '../muscleTaxonomy';
import { calculateExerciseProgressMetrics } from '../progress';
import { exerciseRepository, isOssExerciseDbEnabled } from '../repository';
import type { Exercise } from '../types';

type DetailTab = 'about' | 'history' | 'progress';

const DETAIL_TABS = [
  { label: 'About', value: 'about' },
  { label: 'History', value: 'history' },
  { label: 'Progress', value: 'progress' },
] as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

function TextList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <Text style={styles.secondaryText}>No entries yet.</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Text key={item} style={styles.bodyText}>
          {item}
        </Text>
      ))}
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { workoutSessions } = useAppContext();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('about');
  const [playing, setPlaying] = useState(true);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const loadExercise = async () => {
      if (!exerciseId) {
        setError('Missing exercise.');
        setLoading(false);
        return;
      }

      try {
        const [nextExercise, nextFavoriteIds] = await Promise.all([
          exerciseRepository.getExerciseById(exerciseId),
          loadFavoriteExerciseIds(),
        ]);

        if (cancelled) {
          return;
        }

        setExercise(nextExercise);
        setFavoriteIds(nextFavoriteIds);
        setError(nextExercise ? null : 'Exercise not found.');
      } catch {
        if (!cancelled) {
          setError('Could not load exercise details.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadExercise();

    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  useEffect(() => {
    setMediaFailed(false);
  }, [exerciseId, playing]);

  const historyGroups = useMemo(
    () => (exercise ? selectCompletedSetsByExerciseId(workoutSessions, exercise.id) : []),
    [exercise, workoutSessions]
  );
  const progressMetrics = useMemo(() => calculateExerciseProgressMetrics(historyGroups), [historyGroups]);
  const highlights = useMemo(
    () => (exercise ? buildMuscleHighlights(exercise.primaryMuscles, exercise.secondaryMuscles) : {}),
    [exercise]
  );
  const isFavorite = Boolean(exercise && favoriteIds.has(exercise.id));
  const hasAnimation = Boolean(exercise?.media.animationUrl ?? exercise?.media.gifUri);

  const toggleFavorite = () => {
    if (!exercise) {
      return;
    }

    const nextFavoriteIds = new Set(favoriteIds);
    if (nextFavoriteIds.has(exercise.id)) {
      nextFavoriteIds.delete(exercise.id);
    } else {
      nextFavoriteIds.add(exercise.id);
    }
    setFavoriteIds(nextFavoriteIds);
    void saveFavoriteExerciseIds(nextFavoriteIds);
  };

  const shareExercise = () => {
    if (!exercise) {
      return;
    }

    void Share.share({
      message: `${exercise.name}\nEquipment: ${exercise.equipment.join(', ') || 'None'}\nPrimary: ${exercise.primaryMuscles.join(', ') || 'Not specified'}`,
      title: exercise.name,
    });
  };

  if (loading) {
    return <LoadingState label="Loading exercise" />;
  }

  if (error || !exercise) {
    return (
      <View style={[styles.centeredState, { backgroundColor: colors.background }]}>
        <EmptyState title={error ?? 'Exercise not found'} description="The selected exercise could not be loaded from the local catalog." />
        <AppButton label="Back" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.eight, paddingTop: insets.top + Spacing.three }]}
      keyboardShouldPersistTaps="handled"
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.headerControl}>
            <Text style={styles.headerControlText}>Back</Text>
          </Pressable>
          <Text numberOfLines={2} style={styles.title}>{exercise.name}</Text>
          <Pressable accessibilityRole="button" style={styles.headerControl}>
            <Text style={styles.headerControlText}>More</Text>
          </Pressable>
        </View>

        <SegmentedControl accessibilityLabel="Exercise detail sections" options={DETAIL_TABS} value={tab} onChange={setTab} />

        <AppCard style={styles.mediaCard}>
          <ExerciseMediaPreview colors={colors} exercise={exercise} onMediaError={() => setMediaFailed(true)} playing={playing} resizeMode="contain" showLabel style={styles.media} />
          {hasAnimation && !mediaFailed ? (
            <Pressable accessibilityRole="button" onPress={() => setPlaying((current) => !current)} style={styles.playButton}>
              <Text style={styles.playButtonText}>{playing ? 'Pause' : 'Play'}</Text>
            </Pressable>
          ) : null}
        </AppCard>
        {isOssExerciseDbEnabled() && exercise.source.provider === 'oss-exercisedb' ? (
          <Text style={styles.attribution}>Exercise data and GIFs provided by AscendAPI / ExerciseDB.</Text>
        ) : null}

        <View style={styles.actionRow}>
          <AppButton label="Share Exercise" onPress={shareExercise} variant="secondary" style={styles.actionButton} />
          <AppButton label={isFavorite ? 'Favorited' : 'Add to Favorites'} onPress={toggleFavorite} style={styles.actionButton} />
        </View>

        {tab === 'about' ? (
          <View style={styles.stack}>
            <View style={styles.muscleMaps}>
              <MuscleMap side="front" highlights={highlights} />
              <MuscleMap side="back" highlights={highlights} />
            </View>
            <AppCard>
              <Text style={styles.cardTitle}>Primary muscles</Text>
              <TextList items={exercise.primaryMuscles} />
              <Text style={styles.cardTitle}>Secondary muscles</Text>
              <TextList items={exercise.secondaryMuscles} />
            </AppCard>
            <AppCard>
              <Text style={styles.cardTitle}>Details</Text>
              <Text style={styles.secondaryText}>Body part: {exercise.bodyPart}</Text>
              <Text style={styles.secondaryText}>Equipment: {exercise.equipment.join(', ') || 'None'}</Text>
              <Text style={styles.secondaryText}>Aliases: {exercise.aliases.join(', ') || 'None'}</Text>
            </AppCard>
            <AppCard>
              <Text style={styles.cardTitle}>Instructions</Text>
              <TextList items={exercise.instructions} />
              <Text style={styles.cardTitle}>Coaching tips</Text>
              <TextList items={exercise.coachingTips} />
            </AppCard>
          </View>
        ) : null}

        {tab === 'history' ? (
          <View style={styles.stack}>
            {historyGroups.length === 0 ? (
              <EmptyState title="No history yet" description="Completed sets for this exercise will appear here." />
            ) : (
              historyGroups.map((group) => (
                <AppCard key={group.sessionId}>
                  <Text style={styles.cardTitle}>{group.workoutTitle}</Text>
                  <Text style={styles.secondaryText}>{formatDate(group.finishedAt)}</Text>
                  {group.sets.map((set) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={styles.bodyText}>{set.weight} kg x {set.reps}</Text>
                      {set.actualRpe ? <Text style={styles.secondaryText}>RPE {set.actualRpe}</Text> : null}
                    </View>
                  ))}
                </AppCard>
              ))
            )}
          </View>
        ) : null}

        {tab === 'progress' ? (
          <View style={styles.stack}>
            {historyGroups.length === 0 ? (
              <EmptyState title="No progress yet" description="Complete sets for this exercise to calculate best weight, reps, volume and estimated 1RM." />
            ) : (
              <>
                <View style={styles.metricsGrid}>
                  <MetricCard label="Best weight" value={`${progressMetrics.bestWeight} kg`} />
                  <MetricCard label="Best reps" value={`${progressMetrics.bestReps}`} />
                  <MetricCard label="Volume" value={`${Math.round(progressMetrics.totalVolume).toLocaleString()} kg`} />
                  <MetricCard label="Est. 1RM" value={`${Math.round(progressMetrics.estimatedOneRepMax)} kg`} />
                </View>
                <AppCard>
                  <Text style={styles.cardTitle}>Volume trend</Text>
                  <ProgressTrendChart
                    emptyLabel="Log this exercise in at least two workouts to show a trend."
                    maxLabel="High"
                    minLabel="Low"
                    points={progressMetrics.volumeTrend}
                  />
                </AppCard>
              </>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  bodyText: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  attribution: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  cardTitle: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    marginBottom: Spacing.two,
  },
  centeredState: {
    flex: 1,
    gap: Spacing.four,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  container: {
    alignSelf: 'center',
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    paddingHorizontal: Spacing.four,
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
  list: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  media: {
    aspectRatio: 1.35,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: Radii.medium,
    width: '100%',
  },
  mediaCard: {
    padding: Spacing.two,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  muscleMaps: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  playButton: {
    alignSelf: 'center',
    backgroundColor: Colors.dark.accent,
    borderRadius: Radii.pill,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  playButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: Typography.label.fontSize,
    fontWeight: Typography.label.fontWeight,
  },
  screen: {
    flex: 1,
  },
  secondaryText: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  setRow: {
    alignItems: 'center',
    borderTopColor: Colors.dark.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  stack: {
    gap: Spacing.four,
  },
  title: {
    color: Colors.dark.textPrimary,
    flex: 1,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    lineHeight: Typography.screenTitle.lineHeight,
    textAlign: 'center',
  },
});
