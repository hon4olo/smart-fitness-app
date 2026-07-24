import { Pressable, Text, TextInput, View } from 'react-native';

import type { FoodItem } from '@/api/foods';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { createDraftFromFoodItem } from '@/features/nutrition/addFoodModel';
import { formatFoodMacros, formatFoodServing, formatNumber } from '@/lib/nutrition';
import type { FoodCatalogItem } from '@/types';

type FoodSearchModeSectionProps = {
  backendFoodResults: FoodItem[];
  backendFoodSearchStatus: 'idle' | 'loading' | 'error';
  colors: Record<string, any>;
  favoriteIds: string[];
  foodSuggestions: string[];
  formatProviderLabel: (provider: FoodItem['source']['provider']) => string;
  getFoodAttributionLabel: (food: Pick<FoodItem, 'attribution' | 'source'>) => string;
  onClearQuery: () => void;
  onOpenCatalogFood: (food: FoodCatalogItem) => void;
  onOpenFoodItem: (food: FoodItem) => void;
  onOpenScanner: () => void;
  onQuickAddCatalogFood: (food: FoodCatalogItem) => void;
  onQuickAddFoodItem: (food: FoodItem) => void;
  onSelectSuggestion: (suggestion: string) => void;
  onToggleFavorite: (foodId: string) => void;
  query: string;
  searchResults: FoodCatalogItem[];
  selectedMealLabel: string;
  setQuery: (value: string) => void;
  styles: Record<string, any>;
};

export function FoodSearchModeSection({
  backendFoodResults,
  backendFoodSearchStatus,
  colors,
  favoriteIds,
  foodSuggestions,
  formatProviderLabel,
  getFoodAttributionLabel,
  onClearQuery,
  onOpenCatalogFood,
  onOpenFoodItem,
  onOpenScanner,
  onQuickAddCatalogFood,
  onQuickAddFoodItem,
  onSelectSuggestion,
  onToggleFavorite,
  query,
  searchResults,
  selectedMealLabel,
  setQuery,
  styles,
}: FoodSearchModeSectionProps) {
  const fatSecretAttributionFood = backendFoodResults.find(
    (food) => food.source.provider === 'fatsecret',
  );

  return (
    <AppCard>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Search food"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder="Search food"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            hitSlop={10}
            onPress={onClearQuery}
            style={styles.clearButton}>
            <Text style={styles.clearButtonText}>×</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="Scan food barcode"
          hitSlop={10}
          onPress={onOpenScanner}
          style={styles.scanButton}>
          <Text style={styles.scanButtonText}>Scan</Text>
        </Pressable>
      </View>
      {foodSuggestions.length > 0 ? (
        <View style={styles.suggestionList}>
          {foodSuggestions.map((suggestion) => (
            <Pressable
              accessibilityLabel={`Search ${suggestion}`}
              hitSlop={6}
              key={suggestion}
              onPress={() => onSelectSuggestion(suggestion)}
              style={styles.suggestionChip}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.listGap}>
        {backendFoodSearchStatus === 'loading' ? (
          <Text selectable style={styles.helperText}>
            Searching food database...
          </Text>
        ) : null}
        {backendFoodSearchStatus === 'error' ? (
          <Text selectable style={styles.helperText}>
            Food database unavailable. Showing local foods.
          </Text>
        ) : null}
        {backendFoodResults.map((food) => {
          const draft = createDraftFromFoodItem(food);
          const detailPrefix = food.brand ? `${food.brand} · ` : '';

          return (
            <ListRow
              key={food.id}
              accessibilityHint="Tap to set a portion before adding"
              badge={formatProviderLabel(food.source.provider)}
              detail={`${detailPrefix}${formatFoodServing(draft)} · ${formatNumber(draft.protein)}P · ${formatNumber(draft.carbs)}C · ${formatNumber(draft.fats)}F`}
              onPress={() => onOpenFoodItem(food)}
              title={food.name}
              trailing={
                <Pressable
                  accessibilityLabel={`Quick add ${food.name} to ${selectedMealLabel}`}
                  hitSlop={10}
                  onPress={() => onQuickAddFoodItem(food)}
                  style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>+</Text>
                </Pressable>
              }
              value={`${formatNumber(draft.calories)} kcal`}
            />
          );
        })}
        {fatSecretAttributionFood ? (
          <Text selectable style={styles.resultAttribution}>
            {getFoodAttributionLabel(fatSecretAttributionFood)}
          </Text>
        ) : null}
        {searchResults.length > 0 ? (
          searchResults.map((food) => {
            const favorite = favoriteIds.includes(food.id);
            const favoriteAccessibilityLabel = favorite
              ? `Remove ${food.name} from favorites`
              : `Add ${food.name} to favorites`;

            return (
              <ListRow
                key={food.id}
                accessibilityHint="Tap to set a portion before adding"
                detail={`${formatFoodServing(food)} · ${formatFoodMacros(food)}`}
                onPress={() => onOpenCatalogFood(food)}
                title={food.name}
                trailing={
                  <View style={styles.rowActions}>
                    <Pressable
                      accessibilityLabel={favoriteAccessibilityLabel}
                      hitSlop={10}
                      onPress={() => onToggleFavorite(food.id)}
                      style={styles.iconButton}>
                      <Text style={styles.iconButtonText}>{favorite ? '★' : '☆'}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Quick add ${food.name} to ${selectedMealLabel}`}
                      hitSlop={10}
                      onPress={() => onQuickAddCatalogFood(food)}
                      style={styles.iconButton}>
                      <Text style={styles.iconButtonText}>+</Text>
                    </Pressable>
                  </View>
                }
                value={`${formatNumber(food.calories)} kcal`}
              />
            );
          })
        ) : backendFoodResults.length === 0 && backendFoodSearchStatus !== 'loading' ? (
          <Text selectable style={styles.emptyStateText}>
            No food found
          </Text>
        ) : null}
      </View>
    </AppCard>
  );
}