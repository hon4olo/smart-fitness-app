import { Text, View } from 'react-native';

const macroGridColumns = [
  { key: 'fats', label: 'Fat', flex: 1.6 },
  { key: 'carbs', label: 'Carbs', flex: 1.8 },
  { key: 'protein', label: 'Protein', flex: 2 },
  { key: 'target', label: 'Target', flex: 1.6 },
  { key: 'calories', label: 'Calories', flex: 3 },
] as const;

type MacroGridKey = (typeof macroGridColumns)[number]['key'];

export type MacroGridValues = Record<MacroGridKey, string>;

type NutritionSummaryGridProps = {
  nested?: boolean;
  showLabels?: boolean;
  styles: Record<string, any>;
  values: MacroGridValues;
};

export function NutritionSummaryGrid({ nested = false, showLabels = false, styles, values }: NutritionSummaryGridProps) {
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
              {column.label}
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
