import { StyleSheet, Text } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Colors } from '@/constants/theme';

type EmptyWorkoutStateProps = {
  message: string;
};

export function EmptyWorkoutState({ message }: EmptyWorkoutStateProps) {
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
  },
});
