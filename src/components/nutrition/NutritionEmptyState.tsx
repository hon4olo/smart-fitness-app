import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type NutritionEmptyStateProps = {
  compact?: boolean;
  description: string;
  title: string;
};

export function NutritionEmptyState({ compact = false, description, title }: NutritionEmptyStateProps) {
  const content = (
    <View style={styles.container}>
      <Text selectable style={styles.title}>
        {title}
      </Text>
      <Text selectable style={styles.description}>
        {description}
      </Text>
    </View>
  );

  if (compact) {
    return content;
  }

  return <AppCard>{content}</AppCard>;
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
