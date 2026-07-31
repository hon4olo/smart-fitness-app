import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import type {
  SocialApi,
  SocialWorkoutCommentDto,
} from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import type { SupportedLocale } from '@/localization';

import type { SocialWorkoutPostSurfaceStyles } from './screens/SocialWorkoutPostSurface.styles';
import type { SocialWorkoutPostSurfaceCopy } from './socialWorkoutPostSurfaceCopy';
import {
  buildPendingSocialWorkoutComment,
  formatSocialWorkoutCommentDate,
  getSocialWorkoutCommentLoadError,
  isMissingSocialWorkoutCommentError,
  mergeSocialWorkoutComments,
  removeSocialWorkoutComment,
  type PendingSocialWorkoutComment,
  type SocialWorkoutCommentLoadError,
} from './socialWorkoutCommentModel';

type CommentStatus = 'loading' | 'ready' | 'error';

type SocialWorkoutCommentsCardProps = {
  canComment: boolean;
  cancelLabel: string;
  copy: SocialWorkoutPostSurfaceCopy;
  isPostOwner: boolean;
  locale: SupportedLocale;
  onCreateProfile: () => void;
  ownUsername: string | null;
  postId: string;
  socialApi: SocialApi;
  styles: SocialWorkoutPostSurfaceStyles;
};

const PAGE_SIZE = 20;

export function SocialWorkoutCommentsCard({
  canComment,
  cancelLabel,
  copy,
  isPostOwner,
  locale,
  onCreateProfile,
  ownUsername,
  postId,
  socialApi,
  styles,
}: SocialWorkoutCommentsCardProps) {
  const requestSequence = useRef(0);
  const pendingSubmission = useRef<PendingSocialWorkoutComment | null>(null);
  const [status, setStatus] = useState<CommentStatus>('loading');
  const [comments, setComments] = useState<SocialWorkoutCommentDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadError, setLoadError] =
    useState<SocialWorkoutCommentLoadError | null>(null);
  const [loadMoreBusy, setLoadMoreBusy] = useState(false);
  const [loadMoreError, setLoadMoreError] =
    useState<SocialWorkoutCommentLoadError | null>(null);
  const [draft, setDraft] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setStatus('loading');
    setComments([]);
    setNextCursor(null);
    setLoadError(null);
    setLoadMoreError(null);
    setDeleteError(null);

    try {
      const page = await socialApi.listWorkoutPostComments(postId, {
        limit: PAGE_SIZE,
      });
      if (sequence !== requestSequence.current) return;
      setComments(page.items);
      setNextCursor(page.nextCursor);
      setStatus('ready');
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setLoadError(getSocialWorkoutCommentLoadError(error));
      setStatus('error');
    }
  }, [postId, socialApi]);

  useEffect(() => {
    void loadInitial();
    return () => {
      requestSequence.current += 1;
    };
  }, [loadInitial]);

  const loadMore = async () => {
    if (!nextCursor || loadMoreBusy) return;
    const sequence = requestSequence.current;
    setLoadMoreBusy(true);
    setLoadMoreError(null);
    try {
      const page = await socialApi.listWorkoutPostComments(postId, {
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      if (sequence !== requestSequence.current) return;
      setComments((current) =>
        mergeSocialWorkoutComments(current, page.items),
      );
      setNextCursor(page.nextCursor);
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setLoadMoreError(getSocialWorkoutCommentLoadError(error));
    } finally {
      if (sequence === requestSequence.current) setLoadMoreBusy(false);
    }
  };

  const submit = async () => {
    if (!canComment || submitBusy || draft.trim().length === 0) return;
    const sequence = requestSequence.current;
    const pending = buildPendingSocialWorkoutComment(
      pendingSubmission.current,
      draft,
    );
    pendingSubmission.current = pending;
    setSubmitBusy(true);
    setSubmitError(null);
    try {
      const created = await socialApi.createWorkoutPostComment(postId, pending);
      if (sequence !== requestSequence.current) return;
      setComments((current) => mergeSocialWorkoutComments(current, [created]));
      setDraft('');
      pendingSubmission.current = null;
    } catch {
      if (sequence !== requestSequence.current) return;
      setSubmitError(copy.commentsCreateError);
    } finally {
      if (sequence === requestSequence.current) setSubmitBusy(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (deletingId) return;
    const sequence = requestSequence.current;
    setDeletingId(commentId);
    setDeleteError(null);
    try {
      await socialApi.deleteWorkoutPostComment(postId, commentId);
      if (sequence !== requestSequence.current) return;
      setComments((current) =>
        removeSocialWorkoutComment(current, commentId),
      );
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      if (isMissingSocialWorkoutCommentError(error)) {
        setComments((current) =>
          removeSocialWorkoutComment(current, commentId),
        );
      } else {
        setDeleteError(copy.commentsDeleteError);
      }
    } finally {
      if (sequence === requestSequence.current) setDeletingId(null);
    }
  };

  const confirmDelete = (commentId: string) => {
    Alert.alert(copy.commentsDeleteTitle, copy.commentsDeleteBody, [
      { text: cancelLabel, style: 'cancel' },
      {
        text: copy.commentsDeleteConfirm,
        style: 'destructive',
        onPress: () => deleteComment(commentId),
      },
    ]);
  };

  const errorMessage = (error: SocialWorkoutCommentLoadError | null): string => {
    if (error === 'invalid_cursor') return copy.commentsLoadCursor;
    if (error === 'offline') return copy.commentsLoadOffline;
    if (error === 'session_expired') return copy.commentsLoadSession;
    if (error === 'private') return copy.commentsLoadPrivate;
    if (error === 'blocked') return copy.commentsLoadBlocked;
    if (error === 'not_found') return copy.commentsLoadNotFound;
    return copy.commentsLoadGeneric;
  };

  return (
    <AppCard>
      <Text style={styles.cardTitle}>{copy.commentsTitle}</Text>
      <Text style={styles.body}>{copy.commentsBody}</Text>

      {status === 'loading' ? (
        <LoadingState label={copy.commentsLoading} />
      ) : null}
      {status === 'error' ? (
        <>
          <InlineError message={errorMessage(loadError)} />
          <SecondaryButton label={copy.retry} onPress={loadInitial} />
        </>
      ) : null}

      {status === 'ready' ? (
        <>
          {comments.length === 0 ? (
            <Text style={styles.body}>{copy.commentsEmpty}</Text>
          ) : (
            comments.map((comment) => {
              const canDelete =
                isPostOwner || comment.author.username === ownUsername;
              return (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentHeaderCopy}>
                      <Text style={styles.username}>
                        @{comment.author.username}
                      </Text>
                      <Text style={styles.metaText}>
                        {formatSocialWorkoutCommentDate(
                          comment.createdAt,
                          locale,
                        )}
                      </Text>
                    </View>
                    {canDelete ? (
                      <Pressable
                        accessibilityLabel={copy.commentsDelete}
                        accessibilityRole="button"
                        disabled={deletingId !== null}
                        onPress={() => confirmDelete(comment.id)}
                        style={({ pressed }) => [
                          styles.commentDeleteButton,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={styles.commentDeleteLabel}>
                          {deletingId === comment.id
                            ? `${copy.commentsDelete}…`
                            : copy.commentsDelete}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.commentBody}>{comment.body}</Text>
                </View>
              );
            })
          )}

          <InlineError message={deleteError} />

          {nextCursor ? (
            <>
              <InlineError
                message={loadMoreError ? errorMessage(loadMoreError) : null}
              />
              <SecondaryButton
                disabled={loadMoreBusy}
                label={
                  loadMoreError === 'invalid_cursor'
                    ? copy.commentsReload
                    : copy.commentsLoadMore
                }
                loading={loadMoreBusy}
                onPress={
                  loadMoreError === 'invalid_cursor' ? loadInitial : loadMore
                }
              />
            </>
          ) : null}

          {canComment ? (
            <>
              <FormField
                accessibilityLabel={copy.commentsInputLabel}
                helperText={`${draft.length}/500`}
                label={copy.commentsInputLabel}
                maxLength={500}
                multiline
                onChangeText={setDraft}
                placeholder={copy.commentsInputPlaceholder}
                style={styles.commentInput}
                textAlignVertical="top"
                value={draft}
              />
              <InlineError message={submitError} />
              <PrimaryButton
                disabled={submitBusy || draft.trim().length === 0}
                label={copy.commentsSubmit}
                loading={submitBusy}
                onPress={submit}
              />
            </>
          ) : (
            <>
              <Text style={styles.body}>
                {copy.commentsProfileRequired}
              </Text>
              <SecondaryButton
                label={copy.commentsCreateProfile}
                onPress={onCreateProfile}
              />
            </>
          )}
        </>
      ) : null}
    </AppCard>
  );
}
