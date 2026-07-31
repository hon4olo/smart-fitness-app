import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

import type {
  SocialApi,
  SocialWorkoutReactionDto,
} from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import type { SupportedLocale } from '@/localization';

import type { SocialWorkoutPostSurfaceStyles } from './screens/SocialWorkoutPostSurface.styles';
import { getSocialRateLimitMessage } from './socialRateLimitCopy';
import type { SocialWorkoutPostSurfaceCopy } from './socialWorkoutPostSurfaceCopy';
import {
  getSocialWorkoutReactionLoadError,
  toggleSocialWorkoutReaction,
  type SocialWorkoutReactionLoadError,
} from './socialWorkoutReactionModel';

type ReactionStatus = 'loading' | 'ready' | 'error';

type SocialWorkoutReactionCardProps = {
  canReact: boolean;
  copy: SocialWorkoutPostSurfaceCopy;
  locale: SupportedLocale;
  onCreateProfile: () => void;
  postId: string;
  socialApi: SocialApi;
  styles: SocialWorkoutPostSurfaceStyles;
};

export function SocialWorkoutReactionCard({
  canReact,
  copy,
  locale,
  onCreateProfile,
  postId,
  socialApi,
  styles,
}: SocialWorkoutReactionCardProps) {
  const requestSequence = useRef(0);
  const [status, setStatus] = useState<ReactionStatus>('loading');
  const [reaction, setReaction] = useState<SocialWorkoutReactionDto | null>(
    null,
  );
  const [loadError, setLoadError] =
    useState<SocialWorkoutReactionLoadError | null>(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loadReaction = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setStatus('loading');
    setLoadError(null);
    setMutationError(null);

    try {
      const loaded = await socialApi.getWorkoutPostReaction(postId);
      if (sequence !== requestSequence.current) return;
      setReaction(loaded);
      setStatus('ready');
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setReaction(null);
      setLoadError(getSocialWorkoutReactionLoadError(error));
      setStatus('error');
    }
  }, [postId, socialApi]);

  useEffect(() => {
    void loadReaction();
    return () => {
      requestSequence.current += 1;
    };
  }, [loadReaction]);

  const toggleReaction = async () => {
    if (!canReact || !reaction || mutationBusy) return;
    const sequence = requestSequence.current;
    setMutationBusy(true);
    setMutationError(null);
    try {
      const updated = await toggleSocialWorkoutReaction(
        socialApi,
        postId,
        reaction,
      );
      if (sequence !== requestSequence.current) return;
      setReaction(updated);
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setMutationError(
        getSocialRateLimitMessage(error, locale) ?? copy.reactionUpdateError,
      );
    } finally {
      if (sequence === requestSequence.current) {
        setMutationBusy(false);
      }
    }
  };

  const loadErrorMessage =
    loadError === 'offline'
      ? copy.reactionLoadOffline
      : loadError === 'session_expired'
        ? copy.reactionLoadSession
        : copy.reactionLoadGeneric;

  return (
    <AppCard>
      <Text style={styles.cardTitle}>{copy.reactionTitle}</Text>
      {status === 'loading' ? (
        <LoadingState label={copy.reactionLoading} />
      ) : null}
      {status === 'error' ? (
        <>
          <InlineError message={loadErrorMessage} />
          <SecondaryButton label={copy.retry} onPress={loadReaction} />
        </>
      ) : null}
      {status === 'ready' && reaction ? (
        <>
          <Text style={styles.body}>{copy.reactionBody}</Text>
          {canReact ? (
            <>
              <InlineError message={mutationError} />
              <SecondaryButton
                accessibilityHint={
                  reaction.reacted
                    ? copy.reactionRemoveHint
                    : copy.reactionAddHint
                }
                disabled={mutationBusy}
                label={`${reaction.reacted ? copy.reacted : copy.react} · ${reaction.reactionCount}`}
                loading={mutationBusy}
                onPress={toggleReaction}
              />
            </>
          ) : (
            <>
              <Text style={styles.metaText}>
                {copy.reactionCount}: {reaction.reactionCount}
              </Text>
              <Text style={styles.body}>{copy.reactionProfileRequired}</Text>
              <SecondaryButton
                label={copy.reactionCreateProfile}
                onPress={onCreateProfile}
              />
            </>
          )}
        </>
      ) : null}
    </AppCard>
  );
}
