import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type EmptyProgressStateProps = {
  actionLabel?: string;
  description?: string;
  message: string;
  onActionPress?: () => void;
  title?: string;
};

export function EmptyProgressState({ actionLabel, description, message, onActionPress, title }: EmptyProgressStateProps) {
  return (
    <AppCard>
      <View style={styles.container}>
        {title ? <Text selectable style={styles.title}>{title}</Text> : null}
        <Text selectable style={styles.message}>{message}</Text>
        {description ? <Text selectable style={styles.description}>{description}</Text> : null}
        {actionLabel && onActionPress ? (
          <Pressable accessibilityRole="button" onPress={onActionPress} style={styles.action}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  action: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  actionLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    gap: Spacing.two,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
