import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/theme/AppThemeProvider';

import type { CapabilityGate } from './useCapabilityGate';

type CapabilityStatusNoticeProps = {
  gate: CapabilityGate;
};

export function CapabilityStatusNotice({
  gate,
}: CapabilityStatusNoticeProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  if (gate.canUse) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{gate.title}</Text>
      <Text style={styles.body}>{gate.body}</Text>
      {gate.availability !== 'checking' ? (
        <SecondaryButton
          label={gate.retryLabel}
          onPress={() => void gate.refresh()}
        />
      ) : null}
    </View>
  );
}

const createStyles = (colors: typeof Colors.dark) =>
  StyleSheet.create({
    body: {
      color: colors.textSecondary,
      fontSize: Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    container: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.borderSubtle,
      borderRadius: Radii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      gap: Spacing.two,
      padding: Spacing.three,
    },
    title: {
      color: colors.textPrimary,
      fontSize: Typography.body.fontSize,
      fontWeight: '700',
      lineHeight: Typography.body.lineHeight,
    },
  });
