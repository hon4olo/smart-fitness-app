import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type QuickAction = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

type QuickActionsCardProps = {
  primaryAction?: QuickAction;
  secondaryActions?: QuickAction[];
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title: string;
};

function QuickActionChip({ disabled = false, label, onPress }: QuickAction) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.chip,
        pressed && !disabled && styles.chipPressed,
        disabled && styles.chipDisabled,
      ]}>
      <Text style={[styles.chipLabel, disabled && styles.chipLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

export function QuickActionsCard({ primaryAction, secondaryActions = [], style, subtitle, title }: QuickActionsCardProps) {
  return (
    <AppCard style={style}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {primaryAction ? (
        <AppButton
          disabled={primaryAction.disabled}
          label={primaryAction.label}
          onPress={primaryAction.onPress}
        />
      ) : null}

      {secondaryActions.length > 0 ? (
        <View style={styles.secondaryActions}>
          {secondaryActions.map((action) => (
            <QuickActionChip key={action.label} {...action} />
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  chipLabelDisabled: {
    color: Colors.dark.textSecondary,
  },
  chipPressed: {
    opacity: 0.78,
  },
  header: {
    gap: 4,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
