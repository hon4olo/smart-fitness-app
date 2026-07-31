import { Text, View } from 'react-native';

import type { SocialWorkoutPostDto, SocialWorkoutPostSetDto } from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import {
  formatLocalizedNumber,
  type SupportedLocale,
} from '@/localization';

import type { SocialWorkoutPostSurfaceCopy } from './socialWorkoutPostSurfaceCopy';
import {
  countSocialWorkoutPostSets,
  formatSocialWorkoutPostDate,
} from './socialWorkoutPostSurfaceModel';
import type { SocialWorkoutPostSurfaceStyles } from './screens/SocialWorkoutPostSurface.styles';

type SocialWorkoutPostDetailContentProps = {
  copy: SocialWorkoutPostSurfaceCopy;
  locale: SupportedLocale;
  post: SocialWorkoutPostDto;
  styles: SocialWorkoutPostSurfaceStyles;
};

export function SocialWorkoutPostDetailContent({
  copy,
  locale,
  post,
  styles,
}: SocialWorkoutPostDetailContentProps) {
  const exerciseCount = post.workout.exercises?.length ?? 0;
  const setCount = countSocialWorkoutPostSets(post);
  const hasWorkoutDetails =
    post.workout.durationMinutes !== undefined ||
    post.workout.exercises !== undefined ||
    post.workout.totalVolume !== undefined;

  return (
    <>
      <AppCard style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postHeaderCopy}>
            <Text style={styles.postTitle}>
              {post.workout.title ?? copy.untitledWorkout}
            </Text>
            <Text style={styles.metaText}>
              {formatSocialWorkoutPostDate(post.createdAt, locale)}
            </Text>
          </View>
          <Text style={styles.username}>@{post.author.username}</Text>
        </View>

        <Text style={styles.caption}>{post.caption ?? copy.noCaption}</Text>

        {hasWorkoutDetails ? (
          <View style={styles.metricRow}>
            {post.workout.durationMinutes !== undefined ? (
              <Metric
                label={copy.duration}
                styles={styles}
                value={`${post.workout.durationMinutes} ${copy.minutes}`}
              />
            ) : null}
            {post.workout.exercises !== undefined ? (
              <Metric label={copy.exercises} styles={styles} value={`${exerciseCount}`} />
            ) : null}
            {setCount > 0 ? (
              <Metric label={copy.sets} styles={styles} value={`${setCount}`} />
            ) : null}
            {post.workout.totalVolume !== undefined ? (
              <Metric
                label={copy.volume}
                styles={styles}
                value={formatLocalizedNumber(post.workout.totalVolume, locale)}
              />
            ) : null}
          </View>
        ) : (
          <Text style={styles.body}>{copy.noDetails}</Text>
        )}
      </AppCard>

      {post.workout.exercises?.map((exercise, exerciseIndex) => (
        <AppCard key={`${exercise.name}-${exerciseIndex}`} style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.sets?.map((set, setIndex) => (
            <SetRow
              copy={copy}
              key={`${exercise.name}-${setIndex}`}
              locale={locale}
              set={set}
              setNumber={setIndex + 1}
              styles={styles}
            />
          ))}
        </AppCard>
      ))}
    </>
  );
}

function Metric({
  label,
  styles,
  value,
}: {
  label: string;
  styles: SocialWorkoutPostSurfaceStyles;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SetRow({
  copy,
  locale,
  set,
  setNumber,
  styles,
}: {
  copy: SocialWorkoutPostSurfaceCopy;
  locale: SupportedLocale;
  set: SocialWorkoutPostSetDto;
  setNumber: number;
  styles: SocialWorkoutPostSurfaceStyles;
}) {
  return (
    <View style={styles.setRow}>
      <Text style={styles.detailValue}>{setNumber}</Text>
      {set.weight !== undefined ? (
        <Detail
          label={copy.weight}
          styles={styles}
          value={formatLocalizedNumber(set.weight, locale)}
        />
      ) : null}
      {set.reps !== undefined ? (
        <Detail label={copy.reps} styles={styles} value={`${set.reps}`} />
      ) : null}
      {set.rpe !== undefined ? (
        <Detail
          label={copy.rpe}
          styles={styles}
          value={formatLocalizedNumber(set.rpe, locale)}
        />
      ) : null}
    </View>
  );
}

function Detail({
  label,
  styles,
  value,
}: {
  label: string;
  styles: SocialWorkoutPostSurfaceStyles;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}
