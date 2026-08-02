import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createSocialApi, type SocialWorkoutShareControls } from "@/api/social";
import { AppCard } from "@/components/ui/AppCard";
import { InlineError } from "@/components/ui/InlineError";
import { LoadingState } from "@/components/ui/LoadingState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Spacing } from "@/constants/theme";
import { useAppInfrastructure, useWorkoutState } from "@/context/AppContext";
import { useWeightSync } from "@/context/SyncContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { createUuid } from "@/lib/ids";
import { useLocalization } from "@/localization";
import { useAppTheme } from "@/theme/AppThemeProvider";

import { ShareWorkoutMediaCard } from "../ShareWorkoutMediaCard";
import {
  getSocialContentModerationMessage,
  isSocialContentModerationUiState,
} from "../socialContentModerationUi";
import { isSocialWorkoutPostMediaBusy } from "../socialWorkoutPostMediaModel";
import { getSocialRateLimitMessage } from "../socialRateLimitCopy";
import { getShareWorkoutCopy } from "../shareWorkoutCopy";
import {
  buildShareWorkoutPreview,
  canPublishSocialWorkout,
  DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS,
  getShareWorkoutError,
  shareWorkoutErrorRequiresEdit,
  updateSocialWorkoutShareControl,
  type ShareWorkoutError,
} from "../shareWorkoutModel";
import { useSocialWorkoutPostMedia } from "../useSocialWorkoutPostMedia";
import { createShareWorkoutStyles } from "./ShareWorkoutScreen.styles";

type PublishState = "editing" | "publishing" | "profile_required" | "success";

const readSessionId = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

export default function ShareWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const sessionId = readSessionId(params.sessionId);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const copy = getShareWorkoutCopy(locale);
  const styles = useMemo(() => createShareWorkoutStyles(colors), [colors]);
  const { isRestoringState } = useAppInfrastructure();
  const { workoutSessions } = useWorkoutState();
  const {
    ready,
    isAuthenticated,
    profile: accountProfile,
    refresh,
    session: authSession,
  } = useAuthSession();
  const { syncNow } = useWeightSync();
  const [caption, setCaption] = useState("");
  const [controls, setControls] = useState<SocialWorkoutShareControls>(
    DEFAULT_SOCIAL_WORKOUT_SHARE_CONTROLS,
  );
  const [publishState, setPublishState] = useState<PublishState>("editing");
  const [error, setError] = useState<ShareWorkoutError | "empty" | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const idempotencyKey = useRef(`social-workout-post:${createUuid()}`);

  const workoutSession = useMemo(
    () => workoutSessions.find((item) => item.id === sessionId) ?? null,
    [sessionId, workoutSessions],
  );
  const preview = useMemo(
    () =>
      workoutSession
        ? buildShareWorkoutPreview(workoutSession, controls)
        : null,
    [controls, workoutSession],
  );
  const auth = useMemo(
    () => ({
      getAccessToken: async () => authSession?.tokens.accessToken ?? null,
      refreshAccessToken: async () =>
        (await refresh())?.tokens.accessToken ?? null,
    }),
    [authSession?.tokens.accessToken, refresh],
  );
  const socialApi = useMemo(() => createSocialApi(auth), [auth]);
  const media = useSocialWorkoutPostMedia({
    accountId: accountProfile?.id ?? null,
    sessionId,
    api: socialApi,
    copy,
  });
  const mediaBusy = isSocialWorkoutPostMediaBusy(media.operation);
  const mediaWaiting = media.hasImageDraft && !media.attachment;

  const errorMessage = useMemo(() => {
    if (rateLimitError) return rateLimitError;
    if (isSocialContentModerationUiState(error)) {
      return getSocialContentModerationMessage(error, locale);
    }
    if (error === "empty") return copy.emptyError;
    if (error === "source_not_ready") return copy.sourceNotReady;
    if (error === "offline") return copy.offline;
    if (error === "session_expired") return copy.sessionExpired;
    if (error === "unavailable") return copy.unavailable;
    if (error === "generic") return copy.genericError;
    return null;
  }, [copy, error, locale, rateLimitError]);

  const clearError = () => {
    setError(null);
    setRateLimitError(null);
  };

  const canPublish = () =>
    !mediaWaiting && !mediaBusy && canPublishSocialWorkout(caption, controls);

  const publish = async () => {
    if (
      !workoutSession ||
      publishState === "publishing" ||
      shareWorkoutErrorRequiresEdit(error) ||
      !canPublish()
    ) {
      if (mediaWaiting) media.clearError();
      return;
    }

    setPublishState("publishing");
    clearError();
    try {
      const profile = await socialApi.getOwnProfile();
      if (!profile) {
        setPublishState("profile_required");
        return;
      }

      await syncNow();
      await socialApi.createWorkoutPost({
        sourceWorkoutSessionId: workoutSession.id,
        caption: caption.trim() || null,
        idempotencyKey: idempotencyKey.current,
        share: controls,
        ...(media.attachment ? { image: media.attachment } : {}),
      });
      await media.releaseAfterPublish();
      setPublishState("success");
    } catch (publishError) {
      const rateLimitMessage = getSocialRateLimitMessage(publishError, locale);
      if (rateLimitMessage) {
        setPublishState("editing");
        setRateLimitError(rateLimitMessage);
        return;
      }
      const state = getShareWorkoutError(publishError);
      if (state === "profile_required") {
        setPublishState("profile_required");
      } else {
        setPublishState("editing");
        setError(state);
      }
    }
  };

  const confirmPublish = () => {
    if (shareWorkoutErrorRequiresEdit(error)) return;
    if (mediaWaiting || mediaBusy) return;
    if (!canPublishSocialWorkout(caption, controls)) {
      setRateLimitError(null);
      setError("empty");
      return;
    }
    Alert.alert(copy.publishTitle, copy.publishBody, [
      { text: t("common.cancel"), style: "cancel" },
      { text: copy.publishConfirm, onPress: () => void publish() },
    ]);
  };

  if (isRestoringState || !ready) {
    return (
      <View style={styles.screen}>
        <LoadingState label={copy.publishing} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.six },
      ]}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={copy.back}
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backLabel}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.subtitle}</Text>
          </View>
        </View>

        {!isAuthenticated ? (
          <AppCard>
            <Text style={styles.cardTitle}>{copy.signInTitle}</Text>
            <Text style={styles.body}>{copy.signInBody}</Text>
            <PrimaryButton
              label={copy.signIn}
              onPress={() => router.push("/auth/sign-in")}
            />
          </AppCard>
        ) : null}

        {isAuthenticated && !workoutSession ? (
          <AppCard>
            <Text style={styles.cardTitle}>{copy.missingTitle}</Text>
            <Text style={styles.body}>{copy.missingBody}</Text>
            <SecondaryButton
              label={copy.done}
              onPress={() => router.replace("/workouts")}
            />
          </AppCard>
        ) : null}

        {isAuthenticated &&
        workoutSession &&
        publishState === "profile_required" ? (
          <AppCard>
            <Text style={styles.cardTitle}>{copy.profileTitle}</Text>
            <Text style={styles.body}>{copy.profileBody}</Text>
            <PrimaryButton
              label={copy.createProfile}
              onPress={() => router.push("/settings/social-profile")}
            />
            <SecondaryButton
              label={copy.back}
              onPress={() => setPublishState("editing")}
            />
          </AppCard>
        ) : null}

        {isAuthenticated && workoutSession && publishState === "success" ? (
          <AppCard>
            <Text style={styles.successMark}>✓</Text>
            <Text style={styles.cardTitle}>{copy.successTitle}</Text>
            <Text style={styles.body}>{copy.successBody}</Text>
            <PrimaryButton
              label={copy.done}
              onPress={() => router.replace("/workouts")}
            />
          </AppCard>
        ) : null}

        {isAuthenticated &&
        workoutSession &&
        publishState !== "success" &&
        publishState !== "profile_required" ? (
          <>
            <AppCard>
              <View style={styles.section}>
                <Text style={styles.cardTitle}>{copy.preview}</Text>
                {preview?.title ? (
                  <Text style={styles.previewTitle}>{preview.title}</Text>
                ) : null}
                <View style={styles.previewGrid}>
                  {preview?.durationMinutes !== null ? (
                    <PreviewItem
                      label={copy.duration}
                      value={copy.minutes(preview?.durationMinutes ?? 0)}
                      styles={styles}
                    />
                  ) : null}
                  {preview?.exerciseCount !== null ? (
                    <PreviewItem
                      label={copy.exercises}
                      value={copy.exerciseCount(preview?.exerciseCount ?? 0)}
                      styles={styles}
                    />
                  ) : null}
                  {preview?.setCount !== null ? (
                    <PreviewItem
                      label={copy.sets}
                      value={copy.setCount(preview?.setCount ?? 0)}
                      styles={styles}
                    />
                  ) : null}
                  {preview?.totalVolume !== null ? (
                    <PreviewItem
                      label={copy.volume}
                      value={copy.volumeValue(preview?.totalVolume ?? 0)}
                      styles={styles}
                    />
                  ) : null}
                </View>
                {preview &&
                !preview.includesLoad &&
                !preview.includesRepetitions &&
                !preview.includesRpe ? (
                  <Text style={styles.body}>{copy.detailsHidden}</Text>
                ) : null}
              </View>
            </AppCard>

            <AppCard>
              <View style={styles.section}>
                <Text style={styles.cardTitle}>{copy.fields}</Text>
                <ShareFieldRows
                  controls={controls}
                  copy={copy}
                  onChange={(key, value) => {
                    setControls((current) =>
                      updateSocialWorkoutShareControl(current, key, value),
                    );
                    clearError();
                  }}
                  styles={styles}
                />
              </View>
            </AppCard>

            <ShareWorkoutMediaCard
              controller={media}
              copy={copy}
              styles={styles}
            />

            <AppCard>
              <View style={styles.section}>
                <Text style={styles.label}>{copy.caption}</Text>
                <TextInput
                  maxLength={1000}
                  multiline
                  onChangeText={(value) => {
                    setCaption(value);
                    clearError();
                  }}
                  placeholder={copy.captionPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  style={styles.captionInput}
                  textAlignVertical="top"
                  value={caption}
                />
                <InlineError message={errorMessage} />
                <PrimaryButton
                  disabled={
                    publishState === "publishing" ||
                    mediaWaiting ||
                    mediaBusy ||
                    shareWorkoutErrorRequiresEdit(error)
                  }
                  label={
                    publishState === "publishing"
                      ? copy.publishing
                      : copy.publish
                  }
                  loading={publishState === "publishing"}
                  onPress={confirmPublish}
                />
              </View>
            </AppCard>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ShareFieldRows({
  controls,
  copy,
  onChange,
  styles,
}: {
  controls: SocialWorkoutShareControls;
  copy: ReturnType<typeof getShareWorkoutCopy>;
  onChange: (key: keyof SocialWorkoutShareControls, value: boolean) => void;
  styles: ReturnType<typeof createShareWorkoutStyles>;
}) {
  const rows: Array<{
    key: keyof SocialWorkoutShareControls;
    label: string;
    disabled?: boolean;
  }> = [
    { key: "title", label: copy.workoutTitle },
    { key: "duration", label: copy.duration },
    { key: "exercises", label: copy.exercises },
    { key: "sets", label: copy.sets, disabled: !controls.exercises },
    {
      key: "load",
      label: copy.load,
      disabled: !controls.exercises || !controls.sets,
    },
    {
      key: "repetitions",
      label: copy.repetitions,
      disabled: !controls.exercises || !controls.sets,
    },
    {
      key: "rpe",
      label: copy.rpe,
      disabled: !controls.exercises || !controls.sets,
    },
    { key: "volume", label: copy.volume },
  ];

  return rows.map((row) => (
    <View key={row.key} style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{row.label}</Text>
      <Switch
        disabled={row.disabled}
        onValueChange={(value) => onChange(row.key, value)}
        style={styles.switchControl}
        thumbColor="#FFFFFF"
        trackColor={{ false: "#475569", true: "#14B8A6" }}
        value={controls[row.key]}
      />
    </View>
  ));
}

function PreviewItem({
  label,
  styles,
  value,
}: {
  label: string;
  styles: ReturnType<typeof createShareWorkoutStyles>;
  value: string;
}) {
  return (
    <View style={styles.previewItem}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}
