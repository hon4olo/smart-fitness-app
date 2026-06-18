import { StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

type EmptyProgressStateProps = {
  message: string;
};

export function EmptyProgressState({ message }: EmptyProgressStateProps) {
  return <Text style={styles.emptyText}>{message}</Text>;
}

const styles = StyleSheet.create({
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
});
