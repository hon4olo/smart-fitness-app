import { Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { useLocalization } from '@/localization';
import { getNutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';
import type { FoodCatalogItem, FoodEntry } from '@/types';
import { formatEnergyValue, useUnitPreferences } from '@/units';

type RecentItem = {
  entry: FoodEntry;
  key: string;
  label: string;
  portionLabel: string;
  caloriesLabel: string;
  catalogFood?: FoodCatalogItem;
};

type RecentFoodsModeSectionProps = {
  colors: Record<string, any>;
  items: RecentItem[];
  onOpenFood: (item: RecentItem) => void;
  onQuickAdd: (item: RecentItem) => void;
  onSearchFood: () => void;
  selectedMealLabel: string;
  styles: Record<string, any>;
};

export function RecentFoodsModeSection({
  colors,
  items,
  onOpenFood,
  onQuickAdd,
  onSearchFood,
  selectedMealLabel,
  styles,
}: RecentFoodsModeSectionProps) {
  const { energy } = useUnitPreferences();
  const { locale } = useLocalization();
  const copy = getNutritionAddFoodCopy(locale);

  return (
    <AppCard>
      <View style={styles.sectionHeader}>
        <Text selectable style={styles.sectionTitle}>
          {copy.recentFoods}
        </Text>
      </View>
      {items.length > 0 ? (
        <View style={styles.listGap}>
          {items.map((item) => (
            <ListRow
              key={item.key}
              accessibilityHint={copy.adjustPortion}
              detail={`${item.portionLabel} · ${item.entry.brandName ?? copy.recentFallback} `}
              onPress={() => onOpenFood(item)}
              title={item.label}
              trailing={
                <Pressable
                  accessibilityLabel={copy.quickAdd(item.label, selectedMealLabel)}
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => onQuickAdd(item)}
                  style={styles.iconButton}>
                  <Plus color={colors.textPrimary} size={20} strokeWidth={2.2} />
                </Pressable>
              }
              value={`${formatEnergyValue(item.entry.calories, energy)} ${energy}`}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text selectable style={styles.emptyStateText}>
            {copy.noRecentFoods}
          </Text>
          <AppButton label={copy.searchFood} onPress={onSearchFood} variant="secondary" />
        </View>
      )}
    </AppCard>
  );
}