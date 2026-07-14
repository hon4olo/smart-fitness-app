import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Spacing } from '@/constants/theme';

type EmptyStateProps = {
  actionLabel?: string;
  compact?: boolean;
  description?: string;
  message?: string;
  onActionPress?: () => void;
  title?: string;
};

function EmptyStateContent({ actionLabel, description, message, onActionPress, title }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {title ? <Text selectable style={styles.title}>{title}</Text> : null}
      {message ? <Text selectable style={styles.message}>{message}</Text> : null}
      {description ? <Text selectable style={styles.description}>{description}</Text> : null}
      {actionLabel && onActionPress ? <PrimaryButton label={actionLabel} onPress={onActionPress} /> : null}
    </View>
  );
}

export function EmptyState(props: EmptyStateProps) {
  if (props.compact) {
    return <EmptyStateContent {...props} />;
  }

  return (
    <AppCard>
      <EmptyStateContent {...props} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  message: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 17,
    fontWeight: '800',
  },
});
