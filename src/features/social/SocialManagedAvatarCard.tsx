import { Image } from "expo-image";
import { Alert, StyleSheet, Text, View } from "react-native";

import { DestructiveButton } from "@/components/ui/DestructiveButton";
import { InlineError } from "@/components/ui/InlineError";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Colors, Radii, Spacing, Typography } from "@/constants/theme";
import { useAppTheme } from "@/theme/AppThemeProvider";

import type { SocialManagedAvatarCopy } from "./socialManagedAvatarCopy";
import {
  canRefreshSocialManagedAvatar,
  canRetrySocialManagedAvatar,
  getApprovedAvatarUrl,
  getSocialManagedAvatarOperationLabel,
  getSocialManagedAvatarStatusPresentation,
  isSocialManagedAvatarBusy,
} from "./socialManagedAvatarModel";
import type { SocialManagedAvatarController } from "./useSocialManagedAvatar";

type SocialManagedAvatarCardProps = {
  controller: SocialManagedAvatarController;
  copy: SocialManagedAvatarCopy;
};

export function SocialManagedAvatarCard({
  controller,
  copy,
}: SocialManagedAvatarCardProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const currentUrl = getApprovedAvatarUrl(controller.currentAsset);
  const status = getSocialManagedAvatarStatusPresentation(
    controller.candidateAsset,
    copy,
  );
  const operationLabel = getSocialManagedAvatarOperationLabel(
    controller.operation,
    copy,
  );
  const busy = isSocialManagedAvatarBusy(controller.operation);
  const hasCandidate = Boolean(controller.candidateAsset);
  const canRemove = Boolean(
    (controller.candidateAsset ?? controller.currentAsset) && !busy,
  );

  const confirmRemove = () => {
    Alert.alert(
      copy.deleteTitle,
      hasCandidate ? copy.deleteDraftBody : copy.deleteCurrentBody,
      [
        { text: copy.cancel, style: "cancel" },
        {
          text: copy.deleteAction,
          style: "destructive",
          onPress: () => void controller.remove(),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.description}>{copy.description}</Text>
      </View>

      <View style={styles.previewRow}>
        <View style={styles.previewColumn}>
          <Text style={styles.previewLabel}>{copy.current}</Text>
          {currentUrl ? (
            <Image
              accessibilityLabel={copy.current}
              contentFit="cover"
              source={{ uri: currentUrl }}
              style={styles.avatar}
              transition={150}
            />
          ) : (
            <View style={styles.emptyAvatar}>
              <Text style={styles.emptyAvatarText}>{copy.empty}</Text>
            </View>
          )}
        </View>
        {controller.previewUri ? (
          <View style={styles.previewColumn}>
            <Text style={styles.previewLabel}>{copy.replacement}</Text>
            <Image
              accessibilityLabel={copy.replacement}
              contentFit="cover"
              source={{ uri: controller.previewUri }}
              style={styles.avatar}
              transition={100}
            />
          </View>
        ) : null}
      </View>

      {!controller.profileExists ? (
        <Text style={styles.note}>{copy.profileRequired}</Text>
      ) : null}
      {controller.profileExists && controller.currentAsset && hasCandidate ? (
        <Text style={styles.note}>{copy.preserveCurrent}</Text>
      ) : null}

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>{status.title}</Text>
          <Text style={styles.statusBody}>{status.body}</Text>
        </View>
      ) : null}

      {operationLabel ? (
        <Text accessibilityLiveRegion="polite" style={styles.operation}>
          {operationLabel}
        </Text>
      ) : null}
      {controller.uploadProgress !== null ? (
        <View
          accessibilityLabel={`${Math.round(controller.uploadProgress * 100)}%`}
          accessibilityRole="progressbar"
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(controller.uploadProgress * 100)}%` },
            ]}
          />
        </View>
      ) : null}

      <InlineError message={controller.errorMessage} />

      <PrimaryButton
        disabled={!controller.profileExists || busy}
        label={
          controller.previewUri || controller.currentAsset
            ? copy.change
            : copy.select
        }
        loading={controller.operation === "selecting"}
        onPress={() => void controller.chooseImage()}
      />
      {canRefreshSocialManagedAvatar(controller.candidateAsset) ? (
        <SecondaryButton
          disabled={busy}
          label={copy.refresh}
          onPress={() => void controller.refresh()}
        />
      ) : null}
      {controller.errorMessage ||
      canRetrySocialManagedAvatar(controller.candidateAsset) ? (
        <SecondaryButton
          disabled={!controller.profileExists || busy}
          label={copy.retry}
          onPress={() => void controller.chooseImage()}
        />
      ) : null}
      {canRemove ? (
        <DestructiveButton
          disabled={busy}
          label={copy.remove}
          loading={controller.operation === "deleting"}
          onPress={confirmRemove}
        />
      ) : null}
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    avatar: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 48,
      height: 96,
      width: 96,
    },
    container: { gap: Spacing.three },
    description: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    emptyAvatar: {
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: 48,
      borderWidth: StyleSheet.hairlineWidth,
      height: 96,
      justifyContent: "center",
      padding: Spacing.two,
      width: 96,
    },
    emptyAvatarText: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      textAlign: "center",
    },
    heading: { gap: Spacing.one },
    note: {
      color: colors.textMuted,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    operation: {
      color: colors.accent,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    previewColumn: { gap: Spacing.one },
    previewLabel: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    previewRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.four },
    progressFill: {
      backgroundColor: colors.accent,
      borderRadius: Radii.pill,
      height: "100%",
    },
    progressTrack: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radii.pill,
      height: 6,
      overflow: "hidden",
      width: "100%",
    },
    statusBody: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    statusBox: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.one,
      padding: Spacing.three,
    },
    statusTitle: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.cardTitle.fontSize,
      fontWeight: Typography.cardTitle.fontWeight,
      lineHeight: Typography.cardTitle.lineHeight,
    },
  });
