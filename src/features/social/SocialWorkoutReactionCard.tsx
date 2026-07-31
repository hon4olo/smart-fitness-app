import { Text, View } from 'react-native';

import type { SocialWorkoutReactionDto } from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import type { SocialWorkoutPostSurfaceCopy } from './socialWorkoutPostSurfaceCopy';
import type { SocialWorkoutPostSurfaceStyles } from './screens/SocialWorkoutPostSurface.styles';

type SocialWorkoutReactionCardProps = {
  busy: boolean;
  canReact: boolean;
  copy: SocialWorkoutPostSurfaceCopy;
  errorMessage: string | null;
  loading: boolean;
  onCreateProfile(): void;
  onRetry(): void;
  onToggle(): void;
  reaction: SocialWorkoutReactionDto | null;
  styles: SocialWorkoutPostSurfaceStyles;
};

export function SocialWorkoutReactionCard({
  busy,
  canReact,
  copy,
  errorMessage,
  loading,
  onCreateProfile,
  onRetry,
  onToggle,
  reaction,
  styles,
}: SocialWorkoutReactionCardProps) {
  if (loading && !reaction) {
    return (
      <AppCard>
        <LoadingState label={copy.loadingReaction} />
      </AppCard>
    );
  }

  if (!reaction) {
    return (
      <AppCard>
        <Text style={styles.cardTitle}>{copy.reactionsTitle}</Text>
        <InlineError message={errorMessage ?? copy.reactionErrorGeneric} />
        <SecondaryButton label={copy.retryReaction} onPress={onRetry} />
      </AppCard>
    );
  }

  const actionLabel = canReact
    ? reaction.reacted
      ? copy.reacted
      : copy.react
    : copy.createProfileToReact;

  return (
    <AppCard>
      <View style={styles.reactionRow}>
        <View style={styles.reactionCopy}>
          <Text style={styles.cardTitle}>{reaction.reactionCount}</Text>
          <Text style={styles.body}>{copy.reactionsLabel}</Text>
        </View>
        <SecondaryButton
          disabled={busy}
          label={actionLabel}
          loading={busy}
          onPress={canReact ? onToggle : onCreateProfile}
        />
      </View>
      <InlineError message={errorMessage} />
    </AppCard>
  );
}
