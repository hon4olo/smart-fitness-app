import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import type { SocialProfileListItemDto } from '@/api/social';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import type { SocialRelationshipListsCopy } from './socialRelationshipListsCopy';
import type { SocialRelationshipListKind } from './socialRelationshipListsModel';
import type { SocialRelationshipListsStyles } from './screens/SocialRelationshipListsScreen.styles';

type SocialRelationshipListCardProps = {
  busy: boolean;
  copy: SocialRelationshipListsCopy;
  item: SocialProfileListItemDto;
  kind: SocialRelationshipListKind;
  onApprove(username: string): void;
  onCancel(username: string): void;
  onOpen(username: string): void;
  onReject(username: string): void;
  onUnfollow(username: string): void;
  styles: SocialRelationshipListsStyles;
};

export function SocialRelationshipListCard({
  busy,
  copy,
  item,
  kind,
  onApprove,
  onCancel,
  onOpen,
  onReject,
  onUnfollow,
  styles,
}: SocialRelationshipListCardProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { profile } = item;

  return (
    <AppCard style={styles.itemCard}>
      <Pressable
        accessibilityLabel={`${copy.openProfile}: ${profile.displayName}`}
        accessibilityRole="button"
        onPress={() => onOpen(profile.username)}
        style={({ pressed }) => [styles.profileLink, pressed && styles.pressed]}>
        <View style={styles.identityRow}>
          {profile.avatarUrl && !avatarFailed ? (
            <Image
              accessibilityIgnoresInvertColors
              onError={() => setAvatarFailed(true)}
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {profile.displayName.trim().charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.identityCopy}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.visibility}>
              {profile.visibility === 'private'
                ? copy.privateProfile
                : copy.publicProfile}
            </Text>
          </View>
        </View>
      </Pressable>

      {kind === 'following' ? (
        <SecondaryButton
          disabled={busy}
          label={copy.unfollow}
          loading={busy}
          onPress={() => onUnfollow(profile.username)}
        />
      ) : null}

      {kind === 'incoming' ? (
        <View style={styles.actionRow}>
          <PrimaryButton
            disabled={busy}
            label={copy.approve}
            loading={busy}
            onPress={() => onApprove(profile.username)}
          />
          <SecondaryButton
            disabled={busy}
            label={copy.reject}
            onPress={() => onReject(profile.username)}
          />
        </View>
      ) : null}

      {kind === 'outgoing' ? (
        <SecondaryButton
          disabled={busy}
          label={copy.cancel}
          loading={busy}
          onPress={() => onCancel(profile.username)}
        />
      ) : null}
    </AppCard>
  );
}
