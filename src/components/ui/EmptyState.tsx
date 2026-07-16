import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

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
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onActionPress ? <PrimaryButton label={actionLabel} onPress={onActionPress} /> : null}
    </View>
  );
}

export function EmptyState(props: EmptyStateProps) {
  if (props.compact) {
    return <EmptyStateContent {...props} />;
  }

  return (
    <View style={styles.card}>
      <EmptyStateContent {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.three,
  },
  container: {
    gap: Spacing.two,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
  },
  message: {
    color: Colors.dark.text,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.bodyStrong.fontWeight,
    lineHeight: Typography.body.lineHeight,
  },
  title: {
    color: Colors.dark.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
});
