import { Text, View } from 'react-native';

const macroGridColumns = [
  { key: 'fats', flex: 1.6 },
  { key: 'carbs', flex: 1.8 },
  { key: 'protein', flex: 2 },
  { key: 'target', flex: 1.6 },
  { key: 'calories', flex: 3 },
] as const;

type MacroGridKey = (typeof macroGridColumns)[number]['key'];

export type MacroGridValues = Record<MacroGridKey, string>;
export type MacroGridLabels = Record<MacroGridKey, string>;

type NutritionSummaryGridProps = {
  labels?: MacroGridLabels;
  nested?: boolean;
  showLabels?: boolean;
  styles: Record<string, any>;
  values: MacroGridValues;
};

const defaultLabels: MacroGridLabels = {
  fats: 'Fat',
  carbs: 'Carbs',
  protein: 'Protein',
  target: 'Target',
  calories: 'Calories',
};

export function NutritionSummaryGrid({
  labels = defaultLabels,
  nested = false,
  showLabels = false,
  styles,
  values,
}: NutritionSummaryGridProps) {
  return (
    <View style={[styles.macroGridRow, nested && styles.macroGridRowNested]}>
      {macroGridColumns.map((column, index) => (
        <View
          key={column.key}
          style={[
            styles.macroGridCell,
            { flexGrow: column.flex, flexBasis: 0 },
            index > 0 && styles.macroGridCellWithBorder,
          ]}>
          {showLabels ? (
            <Text numberOfLines={1} selectable style={styles.macroGridLabel}>
              {labels[column.key]}
            </Text>
          ) : null}
          <Text numberOfLines={1} selectable style={styles.macroGridValue}>
            {values[column.key]}
          </Text>
        </View>
      ))}
    </View>
  );
}
