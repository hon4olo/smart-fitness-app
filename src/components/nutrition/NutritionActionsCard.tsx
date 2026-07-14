import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';

type NutritionActionsCardProps = {
  onAddFood: () => void;
  onOpenRecentFoods: () => void;
  onOpenSavedMeals: () => void;
  onOpenSearch: () => void;
};

export function NutritionActionsCard({ onAddFood, onOpenRecentFoods, onOpenSavedMeals, onOpenSearch }: NutritionActionsCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          Quick actions
        </Text>
        <Text selectable style={styles.subtitle}>
          One tap for the main log, quick access for reuse.
        </Text>
      </View>

      <AppButton label="Add Food" onPress={onAddFood} />

      <View style={styles.secondaryRow}>
        <Pressable onPress={onOpenSearch} style={styles.secondaryPill}>
          <Text style={styles.secondaryLabel}>Search</Text>
        </Pressable>
        <Pressable onPress={onOpenRecentFoods} style={styles.secondaryPill}>
          <Text style={styles.secondaryLabel}>Recent</Text>
        </Pressable>
        <Pressable onPress={onOpenSavedMeals} style={styles.secondaryPill}>
          <Text style={styles.secondaryLabel}>Saved Meals</Text>
        </Pressable>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
  },
  secondaryLabel: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryPill: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 88,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
