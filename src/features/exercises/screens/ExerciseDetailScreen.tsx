import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressTrendChart } from '@/components/progress/ProgressTrendChart';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MetricCard } from '@/components/ui/MetricCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Colors, MaxContentWidth, Radii, Spacing, Typography } from '@/constants/theme';
import { useWorkoutState } from '@/context/AppContext';
import {
  getExerciseDetailCopy,
  type ExerciseDetailErrorCode,
} from '@/localization/exerciseDetailCopy';
import { getExerciseLibraryCopy } from '@/localization/exerciseLibraryCopy';
import { useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';
import { useUnitPreferences, weightFromKg } from '@/units';

import { ExerciseMediaPreview } from '../components/ExerciseMediaPreview';
import { MuscleMap } from '../components/MuscleMap';
import { loadFavoriteExerciseIds, saveFavoriteExerciseIds } from '../favoritesRepository';
import { selectCompletedSetsByExerciseId } from '../history';
import { getExerciseMediaUri } from '../media';
import { buildMuscleHighlights } from '../muscleTaxonomy';
import { calculateExerciseProgressMetrics } from '../progress';
import { exerciseRepository, isOssExerciseDbEnabled } from '../repository';
import type { Exercise } from '../types';

type DetailTab = 'about' | 'history' | 'progress';

function TextList({ emptyLabel, items }: { emptyLabel: string; items: string[] }) {
  if (items.length === 0) {
    return <Text style={styles.secondaryText}>{emptyLabel}</Text>;
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
  const { formatDate, formatNumber, locale } = useLocalization();
  const { formatWeightValue, weight: weightUnit } = useUnitPreferences();
  const copy = useMemo(() => getExerciseDetailCopy(locale), [locale]);
  const libraryCopy = useMemo(() => getExerciseLibraryCopy(locale), [locale]);
  const detailTabs = useMemo<Array<{ label: string; value: DetailTab }>>(
    () => [
      { label: copy.tabs.about, value: 'about' },
      { label: copy.tabs.history, value: 'history' },
      { label: copy.tabs.progress, value: 'progress' },
    ],
    [copy],
  );
  const { workoutSessions } = useWorkoutState();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<ExerciseDetailErrorCode | null>(null);
  const [tab, setTab] = useState<DetailTab>('about');
  const [playing, setPlaying] = useState(true);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const loadExercise = async () => {
      if (!exerciseId) {
        setErrorCode('missing');
        setLoading(false);
        return;
      }

      try {
        const [nextExercise, nextFavoriteIds] = await Promise.all([
          exerciseRepository.getExerciseById(exerciseId),
          loadFavoriteExerciseIds(),
        ]);

        if (cancelled) return;
        setExercise(nextExercise);
        setFavoriteIds(nextFavoriteIds);
        setErrorCode(nextExercise ? null : 'not_found');
      } catch {
        if (!cancelled) setErrorCode('load_failed');
      } finally {
        if (!cancelled) setLoading(false);
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
    [exercise, workoutSessions],
  );
  const progressMetrics = useMemo(
    () => calculateExerciseProgressMetrics(historyGroups),
    [historyGroups],
  );
  const displayVolumeTrend = useMemo(
    () =>
      progressMetrics.volumeTrend.map((point) => {
        const value = weightFromKg(point.value, weightUnit);
        return {
          key: point.key,
          label: formatDate(point.finishedAt, { month: 'short', day: 'numeric' }),
          value,
          displayValue: `${formatNumber(value, { maximumFractionDigits: 0 })} ${weightUnit}`,
        };
      }),
    [formatDate, formatNumber, progressMetrics.volumeTrend, weightUnit],
  );
  const highlights = useMemo(
    () =>
      exercise
        ? buildMuscleHighlights(exercise.primaryMuscles, exercise.secondaryMuscles)
        : {},
    [exercise],
  );
  const isFavorite = Boolean(exercise && favoriteIds.has(exercise.id));
  const hasAnimation = Boolean(exercise?.media.animationUrl ?? exercise?.media.gifUri);
  const resolvedMediaUri = exercise
    ? getExerciseMediaUri(exercise, { playing })
    : undefined;
  const formatWeight = (valueKg: number) =>
    `${formatWeightValue(valueKg)} ${weightUnit}`;
  const formatVolume = (valueKg: number) =>
    `${formatNumber(weightFromKg(valueKg, weightUnit), {
      maximumFractionDigits: 0,
    })} ${weightUnit}`;

  const toggleFavorite = () => {
    if (!exercise) return;
    const nextFavoriteIds = new Set(favoriteIds);
    if (nextFavoriteIds.has(exercise.id)) nextFavoriteIds.delete(exercise.id);
    else nextFavoriteIds.add(exercise.id);
    setFavoriteIds(nextFavoriteIds);
    void saveFavoriteExerciseIds(nextFavoriteIds);
  };

  const shareExercise = () => {
    if (!exercise) return;
    const equipment =
      exercise.equipment.map(libraryCopy.facetLabel).join(', ') || copy.none;
    const primaryMuscles = exercise.primaryMuscles.join(', ') || copy.notSpecified;
    void Share.share({
      message: copy.shareMessage(exercise.name, equipment, primaryMuscles),
      title: exercise.name,
    });
  };

  if (loading) return <LoadingState label={copy.loading} />;

  if (errorCode || !exercise) {
    const boundedError = errorCode ?? 'not_found';
    return (
      <View style={[styles.centeredState, { backgroundColor: colors.background }]}>
        <EmptyState
          title={copy.errorTitle(boundedError)}
          description={copy.errorDescription}
        />
        <AppButton label={copy.back} onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + Spacing.eight,
          paddingTop: insets.top + Spacing.three,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={copy.back}
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.headerControl}>
            <Text style={styles.headerControlText}>{copy.back}</Text>
          </Pressable>
          <Text numberOfLines={2} style={styles.title}>
            {exercise.name}
          </Text>
          <Pressable
            accessibilityLabel={copy.more}
            accessibilityRole="button"
            style={styles.headerControl}>
            <Text style={styles.headerControlText}>{copy.more}</Text>
          </Pressable>
        </View>

        <SegmentedControl
          accessibilityLabel={copy.sectionsAccessibility}
          options={detailTabs}
          value={tab}
          onChange={setTab}
        />

        <AppCard style={styles.mediaCard}>
          <ExerciseMediaPreview
            colors={colors}
            exercise={exercise}
            onMediaError={() => setMediaFailed(true)}
            contentFit="contain"
            playing={playing}
            resizeMode="contain"
            showLabel
            style={styles.media}
          />
          {hasAnimation && !mediaFailed ? (
            <Pressable
              accessibilityLabel={playing ? copy.pauseMedia : copy.playMedia}
              accessibilityRole="button"
              onPress={() => setPlaying((current) => !current)}
              style={styles.playButton}>
              <Text style={styles.playButtonText}>
                {playing ? copy.pause : copy.play}
              </Text>
            </Pressable>
          ) : null}
        </AppCard>

        {isOssExerciseDbEnabled() && exercise.source.provider === 'oss-exercisedb' ? (
          <Text style={styles.attribution}>{copy.attribution}</Text>
        ) : null}

        <View style={styles.actionRow}>
          <AppButton
            label={copy.shareExercise}
            onPress={shareExercise}
            variant="secondary"
            style={styles.actionButton}
          />
          <AppButton
            label={isFavorite ? copy.favorite : copy.addFavorite}
            onPress={toggleFavorite}
            style={styles.actionButton}
          />
        </View>

        {tab === 'about' ? (
          <View style={styles.stack}>
            <View style={styles.muscleMaps}>
              <MuscleMap side="front" highlights={highlights} />
              <MuscleMap side="back" highlights={highlights} />
            </View>
            <AppCard>
              <Text style={styles.cardTitle}>{copy.primaryMuscles}</Text>
              <TextList emptyLabel={copy.noEntries} items={exercise.primaryMuscles} />
              <Text style={styles.cardTitle}>{copy.secondaryMuscles}</Text>
              <TextList emptyLabel={copy.noEntries} items={exercise.secondaryMuscles} />
            </AppCard>
            <AppCard>
              <Text style={styles.cardTitle}>{copy.details}</Text>
              <Text style={styles.secondaryText}>
                {copy.bodyPart}: {libraryCopy.facetLabel(exercise.bodyPart)}
              </Text>
              <Text style={styles.secondaryText}>
                {copy.equipment}:{' '}
                {exercise.equipment.map(libraryCopy.facetLabel).join(', ') || copy.none}
              </Text>
              <Text style={styles.secondaryText}>
                {copy.aliases}: {exercise.aliases.join(', ') || copy.none}
              </Text>
            </AppCard>
            <AppCard>
              <Text style={styles.cardTitle}>{copy.instructions}</Text>
              <TextList emptyLabel={copy.noEntries} items={exercise.instructions} />
              <Text style={styles.cardTitle}>{copy.coachingTips}</Text>
              <TextList emptyLabel={copy.noEntries} items={exercise.coachingTips} />
            </AppCard>
          </View>
        ) : null}

        {tab === 'history' ? (
          <View style={styles.stack}>
            {historyGroups.length === 0 ? (
              <EmptyState
                title={copy.noHistoryTitle}
                description={copy.noHistoryDescription}
              />
            ) : (
              historyGroups.map((group) => (
                <AppCard key={group.sessionId}>
                  <Text style={styles.cardTitle}>{group.workoutTitle}</Text>
                  <Text style={styles.secondaryText}>
                    {formatDate(group.finishedAt, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  {group.sets.map((set) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={styles.bodyText}>
                        {formatWeight(set.weight)} ×{' '}
                        {formatNumber(set.reps, { maximumFractionDigits: 0 })}
                      </Text>
                      {set.actualRpe ? (
                        <Text style={styles.secondaryText}>
                          RPE {formatNumber(set.actualRpe, { maximumFractionDigits: 0 })}
                        </Text>
                      ) : null}
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
              <EmptyState
                title={copy.noProgressTitle}
                description={copy.noProgressDescription}
              />
            ) : (
              <>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    label={copy.bestWeight}
                    value={formatWeight(progressMetrics.bestWeight)}
                  />
                  <MetricCard
                    label={copy.bestReps}
                    value={formatNumber(progressMetrics.bestReps, {
                      maximumFractionDigits: 0,
                    })}
                  />
                  <MetricCard
                    label={copy.volume}
                    value={formatVolume(progressMetrics.totalVolume)}
                  />
                  <MetricCard
                    label={copy.estimatedOneRepMax}
                    value={formatWeight(progressMetrics.estimatedOneRepMax)}
                  />
                </View>
                <AppCard>
                  <Text style={styles.cardTitle}>{copy.volumeTrend}</Text>
                  <ProgressTrendChart
                    emptyLabel={copy.volumeTrendEmpty}
                    maxLabel={copy.high(weightUnit)}
                    minLabel={copy.low(weightUnit)}
                    points={displayVolumeTrend}
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
  actionButton: { flex: 1 },
  actionRow: { flexDirection: 'row', gap: Spacing.three },
  attribution: { color: Colors.dark.textSecondary, fontSize: 11, fontWeight: '700', lineHeight: 16, textAlign: 'center' },
  bodyText: { color: Colors.dark.textPrimary, fontSize: Typography.body.fontSize, lineHeight: Typography.body.lineHeight },
  cardTitle: { color: Colors.dark.textPrimary, fontSize: Typography.cardTitle.fontSize, fontWeight: Typography.cardTitle.fontWeight, lineHeight: Typography.cardTitle.lineHeight, marginBottom: Spacing.two },
  centeredState: { flex: 1, gap: Spacing.four, justifyContent: 'center', padding: Spacing.four },
  container: { alignSelf: 'center', gap: Spacing.four, maxWidth: MaxContentWidth, width: '100%' },
  content: { paddingHorizontal: Spacing.four },
  header: { alignItems: 'center', flexDirection: 'row', gap: Spacing.three },
  headerControl: { alignItems: 'center', borderColor: Colors.dark.borderSubtle, borderRadius: Radii.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 40, minWidth: 64, paddingHorizontal: Spacing.three },
  headerControlText: { color: Colors.dark.textPrimary, fontSize: Typography.label.fontSize, fontWeight: Typography.label.fontWeight },
  list: { gap: Spacing.two, marginBottom: Spacing.three },
  media: { aspectRatio: 1.35, backgroundColor: Colors.dark.surfaceSecondary, borderRadius: Radii.medium, width: '100%' },
  mediaCard: { padding: Spacing.two },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  muscleMaps: { flexDirection: 'row', gap: Spacing.three },
  playButton: { alignSelf: 'center', backgroundColor: Colors.dark.accent, borderRadius: Radii.pill, marginTop: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  playButtonText: { color: Colors.dark.textOnAccent, fontSize: Typography.label.fontSize, fontWeight: Typography.label.fontWeight },
  screen: { flex: 1 },
  secondaryText: { color: Colors.dark.textSecondary, fontSize: Typography.callout.fontSize, lineHeight: Typography.callout.lineHeight },
  setRow: { alignItems: 'center', borderTopColor: Colors.dark.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.two },
  stack: { gap: Spacing.four },
  title: { color: Colors.dark.textPrimary, flex: 1, fontSize: Typography.screenTitle.fontSize, fontWeight: Typography.screenTitle.fontWeight, lineHeight: Typography.screenTitle.lineHeight, textAlign: 'center' },
});
