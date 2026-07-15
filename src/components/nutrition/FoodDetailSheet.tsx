import { memo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing } from '@/constants/theme';
import { foodCategoryLabels } from '@/data/foods';
import type { FoodCatalogItem } from '@/types';
import { formatFoodMacros, formatFoodServing } from '@/lib/nutrition';

type FoodDetailSheetProps = {
  food?: FoodCatalogItem | null;
  isFavorite: boolean;
  onAddFood: (servings: number) => void;
  onClose: () => void;
  onSelectSimilar: (food: FoodCatalogItem) => void;
  onToggleFavorite: (food: FoodCatalogItem) => void;
  similarFoods: FoodCatalogItem[];
};

const quickAddButtons = [0.5, 1, 2] as const;

export const FoodDetailSheet = memo(function FoodDetailSheet({
  food,
  isFavorite,
  onAddFood,
  onClose,
  onSelectSimilar,
  onToggleFavorite,
  similarFoods,
}: FoodDetailSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={Boolean(food)}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          {food ? (
            <>
              <View style={styles.handle} />

              <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <View style={styles.headerCopy}>
                    <Text selectable style={styles.title}>
                      {food.name}
                    </Text>
                    <Text selectable style={styles.subtitle}>
                      {foodCategoryLabels[food.category]} · {formatFoodServing(food)}
                    </Text>
                  </View>
                  <AppButton label={isFavorite ? 'Unfavorite' : 'Favorite'} onPress={() => onToggleFavorite(food)} variant="secondary" />
                </View>

                <View style={styles.macroGrid}>
                  <View style={styles.macroCard}>
                    <Text selectable style={styles.macroLabel}>
                      Calories
                    </Text>
                    <Text selectable style={styles.macroValue}>
                      {food.calories}
                    </Text>
                  </View>
                  <View style={styles.macroCard}>
                    <Text selectable style={styles.macroLabel}>
                      Protein
                    </Text>
                    <Text selectable style={styles.macroValue}>
                      {food.protein} g
                    </Text>
                  </View>
                  <View style={styles.macroCard}>
                    <Text selectable style={styles.macroLabel}>
                      Carbs
                    </Text>
                    <Text selectable style={styles.macroValue}>
                      {food.carbs} g
                    </Text>
                  </View>
                  <View style={styles.macroCard}>
                    <Text selectable style={styles.macroLabel}>
                      Fat
                    </Text>
                    <Text selectable style={styles.macroValue}>
                      {food.fat} g
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsBlock}>
                  <Text selectable style={styles.sectionTitle}>
                    Serving info
                  </Text>
                  <Text selectable style={styles.detailLine}>
                    {formatFoodServing(food)} per serving
                  </Text>
                  {food.fiber !== undefined ? (
                    <Text selectable style={styles.detailLine}>
                      Fiber: {food.fiber} g
                    </Text>
                  ) : null}
                  <Text selectable style={styles.detailLine}>
                    Popularity: {food.popularity}
                  </Text>
                </View>

                <View style={styles.detailsBlock}>
                  <Text selectable style={styles.sectionTitle}>
                    Quick add
                  </Text>
                  <View style={styles.quickButtons}>
                    {quickAddButtons.map((servings) => (
                      <AppButton
                        key={servings}
                        label={`${servings}×`}
                        onPress={() => onAddFood(servings)}
                        variant="secondary"
                      />
                    ))}
                  </View>
                  <Text selectable style={styles.helperText}>
                    Adds the food to the current meal using its local serving size.
                  </Text>
                </View>

                <View style={styles.detailsBlock}>
                  <Text selectable style={styles.sectionTitle}>
                    Similar foods
                  </Text>
                  {similarFoods.length > 0 ? (
                    <View style={styles.similarList}>
                      {similarFoods.map((similarFood) => (
                        <Pressable key={similarFood.id} onPress={() => onSelectSimilar(similarFood)} style={styles.similarItem}>
                          <View style={styles.similarCopy}>
                            <Text selectable style={styles.similarName}>
                              {similarFood.name}
                            </Text>
                            <Text selectable style={styles.similarMeta}>
                              {formatFoodMacros(similarFood)}
                            </Text>
                          </View>
                          <Text style={styles.similarArrow}>›</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text selectable style={styles.helperText}>
                      No similar foods in this category.
                    </Text>
                  )}
                </View>

                {food.aliases.length > 0 ? (
                  <View style={styles.detailsBlock}>
                    <Text selectable style={styles.sectionTitle}>
                      Aliases
                    </Text>
                    <View style={styles.tagRow}>
                      {food.aliases.slice(0, 8).map((alias) => (
                        <View key={alias} style={styles.tagPill}>
                          <Text selectable style={styles.tagLabel}>
                            {alias}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  detailLine: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  detailsBlock: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: Colors.dark.border,
    borderRadius: 999,
    height: 5,
    marginBottom: Spacing.two,
    width: 52,
  },
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  macroCard: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: Spacing.two,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  macroLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  macroValue: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '900',
  },
  similarArrow: {
    color: Colors.dark.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  similarCopy: {
    flex: 1,
    gap: 2,
  },
  similarItem: {
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.border,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  similarList: {
    gap: Spacing.two,
  },
  similarMeta: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  similarName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '800',
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sheet: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderColor: Colors.dark.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '88%',
    padding: Spacing.three,
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
    fontSize: 22,
    fontWeight: '900',
  },
});
