import { Pressable, Text, TextInput, View } from 'react-native';

import type { FoodItem } from '@/api/foods';
import { AppCard } from '@/components/ui/AppCard';
import { ListRow } from '@/components/ui/ListRow';
import { createDraftFromFoodItem } from '@/features/nutrition/addFoodModel';
import type { FoodProviderSearchStatus } from '@/features/nutrition/useFoodProviderSearch';
import { formatFoodMacros, formatFoodServing, formatNumber } from '@/lib/nutrition';
import { useLocalization } from '@/localization';
import { getNutritionAddFoodCopy } from '@/localization/nutritionAddFoodCopy';
import type { FoodCatalogItem } from '@/types';
import { formatEnergyValue, useUnitPreferences } from '@/units';

type FoodSearchModeSectionProps = {
  backendFoodResults: FoodItem[];
  backendFoodSearchStatus: FoodProviderSearchStatus;
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
  onToggleProviderFavorite: (food: FoodItem) => void;
  providerFavoriteIds: string[];
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
  onToggleProviderFavorite,
  providerFavoriteIds,
  query,
  searchResults,
  selectedMealLabel,
  setQuery,
  styles,
}: FoodSearchModeSectionProps) {
  const { energy } = useUnitPreferences();
  const { locale } = useLocalization();
  const copy = getNutritionAddFoodCopy(locale);
  const fatSecretAttributionFood = backendFoodResults.find(
    (food) => food.source.provider === 'fatsecret',
  );

  return (
    <AppCard>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel={copy.searchFood}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder={copy.searchFood}
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel={copy.clearSearch}
            hitSlop={10}
            onPress={onClearQuery}
            style={styles.clearButton}>
            <Text style={styles.clearButtonText}>×</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={copy.scanBarcode}
          hitSlop={10}
          onPress={onOpenScanner}
          style={styles.scanButton}>
          <Text style={styles.scanButtonText}>{copy.scan}</Text>
        </Pressable>
      </View>

      {foodSuggestions.length > 0 ? (
        <View style={styles.suggestionList}>
          {foodSuggestions.map((suggestion) => (
            <Pressable
              accessibilityLabel={copy.searchSuggestion(suggestion)}
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
        {backendFoodSearchStatus === 'debouncing' ? (
          <Text selectable style={styles.helperText}>{copy.waitingForTyping}</Text>
        ) : null}
        {backendFoodSearchStatus === 'loading' ? (
          <Text selectable style={styles.helperText}>{copy.searchingDatabase}</Text>
        ) : null}
        {backendFoodSearchStatus === 'empty' ? (
          <Text selectable style={styles.helperText}>{copy.noOnlineMatches}</Text>
        ) : null}
        {backendFoodSearchStatus === 'error' ? (
          <Text selectable style={styles.helperText}>{copy.databaseUnavailable}</Text>
        ) : null}

        {backendFoodResults.map((food) => {
          const draft = createDraftFromFoodItem(food);
          const detailPrefix = food.brand ? `${food.brand} · ` : '';
          const libraryId = `${draft.source}:${draft.externalId ?? food.id}`;
          const favorite = providerFavoriteIds.includes(libraryId);
          return (
            <ListRow
              key={food.id}
              accessibilityHint={copy.tapToSetPortion}
              badge={formatProviderLabel(food.source.provider)}
              detail={`${detailPrefix}${formatFoodServing(draft)} · ${formatNumber(draft.protein)}P · ${formatNumber(draft.carbs)}C · ${formatNumber(draft.fats)}F`}
              onPress={() => onOpenFoodItem(food)}
              title={food.name}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityLabel={favorite ? copy.removeFavorite(food.name) : copy.addFavorite(food.name)}
                    hitSlop={10}
                    onPress={() => onToggleProviderFavorite(food)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>{favorite ? '★' : '☆'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={copy.quickAdd(food.name, selectedMealLabel)}
                    hitSlop={10}
                    onPress={() => onQuickAddFoodItem(food)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>+</Text>
                  </Pressable>
                </View>
              }
              value={`${formatEnergyValue(draft.calories, energy)} ${energy}`}
            />
          );
        })}

        {fatSecretAttributionFood ? (
          <Text selectable style={styles.resultAttribution}>
            {getFoodAttributionLabel(fatSecretAttributionFood)}
          </Text>
        ) : null}

        {searchResults.map((food) => {
          const favorite = favoriteIds.includes(food.id);
          return (
            <ListRow
              key={food.id}
              accessibilityHint={copy.tapToSetPortion}
              detail={`${formatFoodServing(food)} · ${formatFoodMacros(food)}`}
              onPress={() => onOpenCatalogFood(food)}
              title={food.name}
              trailing={
                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityLabel={favorite ? copy.removeFavorite(food.name) : copy.addFavorite(food.name)}
                    hitSlop={10}
                    onPress={() => onToggleFavorite(food.id)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>{favorite ? '★' : '☆'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={copy.quickAdd(food.name, selectedMealLabel)}
                    hitSlop={10}
                    onPress={() => onQuickAddCatalogFood(food)}
                    style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>+</Text>
                  </Pressable>
                </View>
              }
              value={`${formatEnergyValue(food.calories, energy)} ${energy}`}
            />
          );
        })}

        {query.trim().length > 0 &&
        backendFoodResults.length === 0 &&
        searchResults.length === 0 &&
        backendFoodSearchStatus !== 'loading' &&
        backendFoodSearchStatus !== 'debouncing' ? (
          <Text selectable style={styles.emptyStateText}>{copy.noFoodFound}</Text>
        ) : null}
      </View>
    </AppCard>
  );
}
