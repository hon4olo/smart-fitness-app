import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import type { FoodCatalogItem, FoodEntry } from '@/types';

type RecentItem = {
  entry: FoodEntry;
  key: string;
  label: string;
  portionLabel: string;
  caloriesLabel: string;
  catalogFood?: FoodCatalogItem;
};

type RecentFoodsModeSectionProps = {
  items: RecentItem[];
  onOpenFood: (item: RecentItem) => void;
  onQuickAdd: (item: RecentItem) => void;
  onSearchFood: () => void;
  selectedMealLabel: string;
  styles: Record<string, any>;
};

export function RecentFoodsModeSection({ items, onOpenFood, onQuickAdd, onSearchFood, selectedMealLabel, styles }: RecentFoodsModeSectionProps) {
  return (
    <AppCard>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          Recent foods
        </Text>
      </View>
      {items.length > 0 ? (
        <View style={styles.listGap}>
          {items.map((item) => (
            <ListRow
              key={item.key}
              accessibilityHint="Tap to adjust the portion"
              detail={`${item.portionLabel} · ${item.entry.brandName ?? 'recent'} `}
              onPress={() => onOpenFood(item)}
              title={item.label}
              trailing={
                <Pressable accessibilityLabel={`Quick add ${item.label} to ${selectedMealLabel}`} hitSlop={10} onPress={() => onQuickAdd(item)} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>+</Text>
                </Pressable>
              }
              value={item.caloriesLabel}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text selectable style={styles.emptyStateText}>
            No recent foods yet.
          </Text>
          <AppButton label="Search food" onPress={onSearchFood} variant="secondary" />
        </View>
      )}
    </AppCard>
  );
}
