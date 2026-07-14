import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { Colors, Spacing } from '@/constants/theme';
import { foodCategoryLabels } from '@/data/foods';
import type { FoodBrowserMode, FoodCatalogItem, FoodCategory } from '@/types';
import { formatFoodMacros, formatFoodServing } from '@/lib/nutrition';

import { NutritionEmptyState } from './NutritionEmptyState';

type FilterChip = {
  count?: number;
  label: string;
  selected: boolean;
  onPress: () => void;
};

type FoodBrowserSectionProps = {
  categoryChips: FilterChip[];
  favoriteFoods: FoodCatalogItem[];
  favoriteIds: string[];
  filteredFoods: FoodCatalogItem[];
  foodSearchQuery: string;
  isExpanded: boolean;
  modeChips: FilterChip[];
  onOpenFood: (food: FoodCatalogItem) => void;
  onQuickAddFood: (food: FoodCatalogItem) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleExpanded: () => void;
  onToggleFavorite: (food: FoodCatalogItem) => void;
  popularFoods: FoodCatalogItem[];
  recentFoods: FoodCatalogItem[];
  selectedCategory: FoodCategory | 'all';
  selectedMode: FoodBrowserMode;
};

const renderFoodCard = (
  food: FoodCatalogItem,
  handlers: {
    onOpenFood: (food: FoodCatalogItem) => void;
    onQuickAddFood: (food: FoodCatalogItem, servings?: number) => void;
    onToggleFavorite: (food: FoodCatalogItem) => void;
  },
  isFavorite: boolean,
) => {
  return (
    <View key={food.id} style={styles.foodCard}>
      <Pressable onPress={() => handlers.onOpenFood(food)} style={styles.foodCardMain}>
        <View style={styles.foodHeaderRow}>
          <View style={styles.foodHeaderCopy}>
            <Text selectable style={styles.foodName}>
              {food.name}
            </Text>
            <Text selectable style={styles.foodMeta}>
              {foodCategoryLabels[food.category]}
              {food.popularity ? ` · Popular ${food.popularity}` : ''}
            </Text>
          </View>
          <Text style={styles.favoriteGlyph}>{isFavorite ? '★' : '☆'}</Text>
        </View>

        <Text selectable style={styles.foodServing}>
          Serving: {formatFoodServing(food)}
        </Text>
        <Text selectable style={styles.foodMacros}>
          {formatFoodMacros(food)}
        </Text>

        <View style={styles.tagRow}>
          {food.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text selectable style={styles.tagLabel}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </Pressable>

      <View style={styles.cardActions}>
        <AppButton label="Add" onPress={() => handlers.onQuickAddFood(food)} variant="secondary" />
        <AppButton label={isFavorite ? 'Unfavorite' : 'Favorite'} onPress={() => handlers.onToggleFavorite(food)} variant="secondary" />
      </View>
    </View>
  );
};

export function FoodBrowserSection({
  categoryChips,
  favoriteFoods,
  filteredFoods,
  foodSearchQuery,
  isExpanded,
  modeChips,
  onOpenFood,
  onQuickAddFood,
  onSearchQueryChange,
  onToggleExpanded,
  onToggleFavorite,
  popularFoods,
  recentFoods,
  selectedCategory,
  selectedMode,
  favoriteIds,
}: FoodBrowserSectionProps) {
  const showCollections = foodSearchQuery.trim().length === 0 && selectedMode === 'all' && selectedCategory === 'all';

  return (
    <AppCard>
      <Pressable onPress={onToggleExpanded} style={styles.headerPressable}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text selectable style={styles.title}>
              {`Food browser ${isExpanded ? '−' : '+'}`}
            </Text>
            <Text selectable style={styles.subtitle}>
              Search aliases, partial matches, categories, and tags. Save favorites and open details for similar foods.
            </Text>
          </View>
          <Text style={styles.toggleGlyph}>{isExpanded ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {isExpanded ? (
        <View style={styles.body}>
          <View style={styles.searchBlock}>
            <Text selectable style={styles.sectionLabel}>
              Search foods
            </Text>
            <TextInput
              onChangeText={onSearchQueryChange}
              placeholder="Chicken breast, oats, avocado, salsa..."
              placeholderTextColor={Colors.dark.textSecondary}
              style={styles.input}
              value={foodSearchQuery}
            />
            <Text selectable style={styles.helperText}>
              Try aliases like “pb”, tags like “high-protein”, or category names like “fruit”.
            </Text>
          </View>

          <View style={styles.filterGroup}>
            <Text selectable style={styles.filterLabel}>
              Browse mode
            </Text>
            <View style={styles.chipRow}>
              {modeChips.map((chip) => (
                <Pressable key={chip.label} onPress={chip.onPress} style={[styles.chip, chip.selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, chip.selected && styles.chipTextSelected]}>{chip.label}</Text>
                  {chip.count !== undefined ? <Text style={[styles.chipCount, chip.selected && styles.chipTextSelected]}>{chip.count}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text selectable style={styles.filterLabel}>
              Categories
            </Text>
            <View style={styles.chipRow}>
              {categoryChips.map((chip) => (
                <Pressable key={chip.label} onPress={chip.onPress} style={[styles.chip, chip.selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, chip.selected && styles.chipTextSelected]}>{chip.label}</Text>
                  {chip.count !== undefined ? <Text style={[styles.chipCount, chip.selected && styles.chipTextSelected]}>{chip.count}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>

          {showCollections ? (
            <View style={styles.collections}>
              {favoriteFoods.length > 0 ? (
                <View style={styles.collectionBlock}>
                  <Text selectable style={styles.collectionTitle}>
                    Favorites
                  </Text>
                  <View style={styles.collectionList}>
                    {favoriteFoods.map((food) => renderFoodCard(food, { onOpenFood, onQuickAddFood, onToggleFavorite }, favoriteIds.includes(food.id)))}
                  </View>
                </View>
              ) : null}

              {recentFoods.length > 0 ? (
                <View style={styles.collectionBlock}>
                  <Text selectable style={styles.collectionTitle}>
                    Recent foods
                  </Text>
                  <View style={styles.collectionList}>
                    {recentFoods.map((food) => renderFoodCard(food, { onOpenFood, onQuickAddFood, onToggleFavorite }, favoriteIds.includes(food.id)))}
                  </View>
                </View>
              ) : null}

              <View style={styles.collectionBlock}>
                <Text selectable style={styles.collectionTitle}>
                  Popular foods
                </Text>
                <View style={styles.collectionList}>
                  {popularFoods.map((food) => renderFoodCard(food, { onOpenFood, onQuickAddFood, onToggleFavorite }, favoriteIds.includes(food.id)))}
                </View>
              </View>
            </View>
          ) : filteredFoods.length > 0 ? (
            <View style={styles.results}>
              <Text selectable style={styles.resultsCount}>
                {filteredFoods.length} food{filteredFoods.length === 1 ? '' : 's'}
              </Text>
              <View style={styles.collectionList}>
                {filteredFoods.map((food) => renderFoodCard(food, { onOpenFood, onQuickAddFood, onToggleFavorite }, favoriteIds.includes(food.id)))}
              </View>
            </View>
          ) : (
            <NutritionEmptyState
              compact
              description="Try another term, switch category, or browse recent and popular foods."
              title="No foods found"
            />
          )}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.three,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryPill: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  chipCount: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipSelected: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  chipText: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: Colors.dark.background,
  },
  collectionBlock: {
    gap: Spacing.two,
  },
  collectionTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  collectionList: {
    gap: Spacing.two,
  },
  collections: {
    gap: Spacing.three,
  },
  favoriteGlyph: {
    color: Colors.dark.accent,
    fontSize: 18,
    fontWeight: '900',
    paddingLeft: Spacing.two,
  },
  filterGroup: {
    gap: Spacing.one,
  },
  filterLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  foodCard: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  foodCardMain: {
    gap: Spacing.one,
  },
  foodHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  foodHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  foodMacros: {
    color: Colors.dark.text,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  foodMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  foodName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  foodServing: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerPressable: {
    paddingBottom: Spacing.two,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  results: {
    gap: Spacing.two,
  },
  resultsCount: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  searchBlock: {
    gap: Spacing.one,
  },
  sectionLabel: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  tagLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tagPill: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.one,
    paddingVertical: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
  toggleGlyph: {
    color: Colors.dark.accent,
    fontSize: 24,
    fontWeight: '800',
  },
});
