import { Image, Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { InlineError } from "@/components/ui/InlineError";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

import type { ShareWorkoutStyles } from "./screens/ShareWorkoutScreen.styles";
import type { getShareWorkoutCopy } from "./shareWorkoutCopy";
import type { SocialWorkoutPostMediaController } from "./useSocialWorkoutPostMedia";
import {
  canRefreshSocialWorkoutPostMedia,
  getSocialWorkoutPostMediaOperationLabel,
  getSocialWorkoutPostMediaStatus,
  isSocialWorkoutPostMediaBusy,
} from "./socialWorkoutPostMediaModel";

type ShareWorkoutMediaCardProps = {
  controller: SocialWorkoutPostMediaController;
  copy: ReturnType<typeof getShareWorkoutCopy>;
  styles: ShareWorkoutStyles;
};

export function ShareWorkoutMediaCard({
  controller,
  copy,
  styles,
}: ShareWorkoutMediaCardProps) {
  const busy = isSocialWorkoutPostMediaBusy(controller.operation);
  const operationLabel = getSocialWorkoutPostMediaOperationLabel(
    controller.operation,
    copy,
  );
  const status = getSocialWorkoutPostMediaStatus(controller.asset, copy);
  const remotePreview =
    controller.asset?.state === "approved"
      ? (controller.asset.publicDescriptor?.variants.post_640?.url ?? null)
      : null;
  const previewUri = controller.previewUri ?? remotePreview;
  const canRefresh = canRefreshSocialWorkoutPostMedia(controller.asset);

  return (
    <AppCard>
      <View style={styles.section}>
        <View style={styles.mediaHeader}>
          <View style={styles.mediaHeaderCopy}>
            <Text style={styles.cardTitle}>{copy.imageTitle}</Text>
            <Text style={styles.body}>{copy.imageOptional}</Text>
          </View>
        </View>

        {previewUri ? (
          <Image
            accessibilityLabel={copy.imageTitle}
            resizeMode="cover"
            source={{ uri: previewUri }}
            style={styles.mediaPreview}
          />
        ) : null}

        {operationLabel ? <Text style={styles.body}>{operationLabel}</Text> : null}
        {controller.uploadProgress !== null ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(controller.uploadProgress * 100)}%` },
              ]}
            />
          </View>
        ) : null}
        {status ? <Text style={styles.body}>{status}</Text> : null}
        {controller.hasImageDraft && !controller.attachment && !busy ? (
          <Text style={styles.mediaWarning}>{copy.imageWaiting}</Text>
        ) : null}
        <InlineError message={controller.errorMessage} />

        <PrimaryButton
          disabled={busy}
          label={previewUri ? copy.replaceImage : copy.chooseImage}
          onPress={() => void controller.chooseImage()}
        />
        {canRefresh ? (
          <SecondaryButton
            disabled={busy}
            label={copy.refreshImage}
            onPress={() => void controller.refresh()}
          />
        ) : null}
        {controller.hasImageDraft ? (
          <SecondaryButton
            disabled={busy}
            label={copy.removeImage}
            onPress={() => void controller.remove()}
          />
        ) : null}
      </View>
    </AppCard>
  );
}
