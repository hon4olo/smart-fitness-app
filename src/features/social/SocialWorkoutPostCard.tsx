import { Pressable, Text, View } from 'react-native';

import type { SocialWorkoutPostDto } from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import {
  formatLocalizedNumber,
  type SupportedLocale,
} from '@/localization';

import { SocialWorkoutPostImage } from './SocialWorkoutPostImage';
import type { SocialWorkoutPostSurfaceCopy } from './socialWorkoutPostSurfaceCopy';
import {
  countSocialWorkoutPostSets,
  formatSocialWorkoutPostDate,
} from './socialWorkoutPostSurfaceModel';
import type { SocialWorkoutPostSurfaceStyles } from './screens/SocialWorkoutPostSurface.styles';

type SocialWorkoutPostCardProps = {
  copy: SocialWorkoutPostSurfaceCopy;
  locale: SupportedLocale;
  onOpen(postId: string): void;
  post: SocialWorkoutPostDto;
  styles: SocialWorkoutPostSurfaceStyles;
};

export function SocialWorkoutPostCard({
  copy,
  locale,
  onOpen,
  post,
  styles,
}: SocialWorkoutPostCardProps) {
  const exerciseCount = post.workout.exercises?.length ?? 0;
  const setCount = countSocialWorkoutPostSets(post);

  return (
    <Pressable
      accessibilityLabel={`${copy.openPost}: ${post.workout.title ?? copy.untitledWorkout}`}
      accessibilityRole="button"
      onPress={() => onOpen(post.id)}
      style={({ pressed }) => pressed && styles.pressed}>
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

        {post.image ? (
          <SocialWorkoutPostImage descriptor={post.image} styles={styles} />
        ) : null}
        {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

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
      </AppCard>
    </Pressable>
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
