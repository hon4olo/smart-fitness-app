import { memo, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

type SessionEmptySetsProps = {
  label?: string;
};

export const SessionEmptySets = memo(function SessionEmptySets({ label = 'No sets logged yet.' }: SessionEmptySetsProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <Text selectable style={styles.emptySets}>{label}</Text>;
});

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    emptySets: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingVertical: Spacing.two,
    },
  });
