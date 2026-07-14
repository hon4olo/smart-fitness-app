import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppSection } from '@/components/ui/AppSection';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Spacing } from '@/constants/theme';

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

export function QuickActionsCard({ primaryAction, secondaryActions = [], style, subtitle, title }: QuickActionsCardProps) {
  return (
    <AppSection bodyStyle={styles.body} style={style} subtitle={subtitle} title={title}>
      {primaryAction ? (
        <PrimaryButton disabled={primaryAction.disabled} label={primaryAction.label} onPress={primaryAction.onPress} />
      ) : null}

      {secondaryActions.length > 0 ? (
        <View style={styles.secondaryActions}>
          {secondaryActions.map((action) => (
            <SecondaryButton key={action.label} disabled={action.disabled} label={action.label} onPress={action.onPress} style={styles.secondaryButton} />
          ))}
        </View>
      ) : null}
    </AppSection>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.two,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  secondaryButton: {
    flexGrow: 1,
    minWidth: 132,
  },
});
