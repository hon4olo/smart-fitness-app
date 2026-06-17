import { StyleSheet, Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors } from '@/constants/theme';

type EmptyNutritionStateProps = {
  message: string;
};

export function EmptyNutritionState({ message }: EmptyNutritionStateProps) {
  return (
    <AppCard>
      <Text selectable style={styles.text}>
        {message}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
