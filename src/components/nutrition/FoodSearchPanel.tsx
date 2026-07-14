import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { FoodSearchResult } from '@/components/nutrition/nutrition-types';
import { FoodSearchResults } from '@/components/nutrition/FoodSearchResults';

type FoodSearchPanelProps = {
  filteredFoods: FoodSearchResult[];
  foodSearchQuery: string;
  onFoodSearchQueryChange: (value: string) => void;
  onUseFood: (food: FoodSearchResult) => void;
};

export function FoodSearchPanel({ filteredFoods, foodSearchQuery, onFoodSearchQueryChange, onUseFood }: FoodSearchPanelProps) {
  return (
    <>
      <View style={styles.searchPanelHeader}>
        <Text selectable style={styles.sectionTitle}>
          Search food
        </Text>
        <Text selectable style={styles.searchPanelHint}>
          {foodSearchQuery.trim().length > 0 ? 'Tap Use to copy a prior item.' : 'Start typing to search by name or brand.'}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          onChangeText={onFoodSearchQueryChange}
          placeholder="Search name or brand"
          placeholderTextColor={Colors.dark.textSecondary}
          style={styles.input}
          value={foodSearchQuery}
        />
      </View>

      {foodSearchQuery.trim().length === 0 ? (
        <Text selectable style={styles.helperText}>
          Search results appear here as you type. Use the top actions to jump back later.
        </Text>
      ) : filteredFoods.length === 0 ? (
        <Text selectable style={styles.helperText}>
          No search results yet.
        </Text>
      ) : (
        <FoodSearchResults filteredFoods={filteredFoods} onUseFood={onUseFood} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  searchPanelHeader: {
    gap: 2,
  },
  searchPanelHint: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '800',
  },
});
