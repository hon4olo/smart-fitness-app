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
    backgroundColor: Colors.dark.surfaceAccent,
    borderColor: Colors.dark.borderSubtle,
    borderCurve: 'continuous',
    borderRadius: Radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
  },
  container: {
    gap: Spacing.two,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.callout.fontSize,
    lineHeight: Typography.callout.lineHeight,
  },
  message: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.bodyEmphasized.fontSize,
    fontWeight: Typography.bodyEmphasized.fontWeight,
    lineHeight: Typography.bodyEmphasized.lineHeight,
  },
  title: {
    color: Colors.dark.textPrimary,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    letterSpacing: Typography.sectionTitle.letterSpacing,
    lineHeight: Typography.sectionTitle.lineHeight,
    textTransform: Typography.sectionTitle.textTransform,
  },
});
