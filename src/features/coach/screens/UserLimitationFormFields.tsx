import { Pressable, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useAppTheme } from '@/theme/AppThemeProvider';
import type {
  UserLimitation,
  UserLimitationBodyRegion,
  UserLimitationKind,
  UserLimitationMovementPattern,
  UserLimitationSeverity,
  UserLimitationSide,
  UserLimitationTrainingImpact,
} from '@/types';

import { styles } from './userLimitationScreen.styles';

type Option<Value extends string> = {
  label: string;
  value: Value;
};

export const KIND_OPTIONS: readonly Option<UserLimitationKind>[] = [
  { label: 'Injury', value: 'injury' },
  { label: 'Pain', value: 'pain' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Medical restriction', value: 'medical_restriction' },
  { label: 'Other', value: 'other' },
];

export const BODY_REGION_OPTIONS: readonly Option<UserLimitationBodyRegion>[] = [
  { label: 'Neck', value: 'neck' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Elbow', value: 'elbow' },
  { label: 'Wrist / hand', value: 'wrist_hand' },
  { label: 'Upper back', value: 'upper_back' },
  { label: 'Lower back', value: 'lower_back' },
  { label: 'Hip', value: 'hip' },
  { label: 'Knee', value: 'knee' },
  { label: 'Ankle / foot', value: 'ankle_foot' },
  { label: 'Chest', value: 'chest' },
  { label: 'Abdomen', value: 'abdomen' },
  { label: 'Systemic', value: 'systemic' },
  { label: 'Other', value: 'other' },
];

export const SIDE_OPTIONS: readonly Option<UserLimitationSide>[] = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Both', value: 'bilateral' },
  { label: 'Midline', value: 'midline' },
  { label: 'N/A', value: 'not_applicable' },
];

export const SEVERITY_OPTIONS: readonly Option<UserLimitationSeverity>[] = [
  { label: 'Mild', value: 'mild' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Severe', value: 'severe' },
];

export const IMPACT_OPTIONS: readonly Option<UserLimitationTrainingImpact>[] = [
  { label: 'Monitor', value: 'monitor' },
  { label: 'Reduce load', value: 'reduce_load' },
  { label: 'Avoid movement', value: 'avoid_movement' },
  { label: 'Pause training', value: 'pause_training' },
];

const MOVEMENT_OPTIONS: readonly Option<UserLimitationMovementPattern>[] = [
  { label: 'Squat', value: 'squat' },
  { label: 'Hinge', value: 'hinge' },
  { label: 'Lunge', value: 'lunge' },
  { label: 'Horizontal push', value: 'horizontal_push' },
  { label: 'Vertical push', value: 'vertical_push' },
  { label: 'Horizontal pull', value: 'horizontal_pull' },
  { label: 'Vertical pull', value: 'vertical_pull' },
  { label: 'Carry', value: 'carry' },
  { label: 'Rotation', value: 'rotation' },
  { label: 'Locomotion', value: 'locomotion' },
  { label: 'Impact', value: 'impact' },
  { label: 'Overhead', value: 'overhead' },
  { label: 'Spinal flexion', value: 'spinal_flexion' },
  { label: 'Spinal extension', value: 'spinal_extension' },
  { label: 'Other', value: 'other' },
];

const formatCode = (value: string): string =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function ChoiceGrid<Value extends string>({
  label,
  options,
  value,
  onChange,
  columns = 2,
}: {
  label: string;
  options: readonly Option<Value>[];
  value: Value | null;
  onChange(value: Value): void;
  columns?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View accessibilityLabel={label} style={styles.choiceGrid}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.choice,
                { flexBasis: `${100 / columns - 2}%` },
                {
                  backgroundColor: selected ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: selected ? colors.accent : colors.borderSubtle,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.choiceLabel,
                  { color: selected ? colors.accent : colors.textPrimary },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MovementGrid({
  values,
  onToggle,
}: {
  values: UserLimitationMovementPattern[];
  onToggle(value: UserLimitationMovementPattern): void;
}) {
  const { colors } = useAppTheme();
  const selected = new Set(values);
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Movement patterns</Text>
      <Text style={[styles.helperText, { color: colors.textMuted }]}>Required for “Avoid movement”. Optional context for other impacts.</Text>
      <View style={styles.choiceGrid}>
        {MOVEMENT_OPTIONS.map((option) => {
          const active = selected.has(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              onPress={() => onToggle(option.value)}
              style={({ pressed }) => [
                styles.movementChoice,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surfaceElevated,
                  borderColor: active ? colors.accent : colors.borderSubtle,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.movementLabel,
                  { color: active ? colors.accent : colors.textSecondary },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function LimitationRow({
  limitation,
  disabled,
  onDelete,
  onStatusChange,
}: {
  limitation: UserLimitation;
  disabled: boolean;
  onDelete(): void;
  onStatusChange(): void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.limitationRow, { borderColor: colors.borderSubtle }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            {formatCode(limitation.bodyRegion)} · {formatCode(limitation.side)}
          </Text>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            {formatCode(limitation.kind)} · {formatCode(limitation.severity)} ·{' '}
            {formatCode(limitation.trainingImpact)}
          </Text>
        </View>
        <Text
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                limitation.status === 'active' ? colors.warningSoft : colors.successSoft,
              color: limitation.status === 'active' ? colors.warning : colors.success,
            },
          ]}>
          {limitation.status.toUpperCase()}
        </Text>
      </View>
      {limitation.movementPatterns.length > 0 ? (
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          Movements: {limitation.movementPatterns.map(formatCode).join(', ')}
        </Text>
      ) : null}
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        Onset: {limitation.onsetDate ?? 'not specified'}
        {limitation.resolvedDate ? ` · resolved ${limitation.resolvedDate}` : ''}
      </Text>
      <View style={styles.rowActions}>
        <SecondaryButton
          disabled={disabled}
          label={limitation.status === 'active' ? 'Mark resolved' : 'Reactivate'}
          onPress={onStatusChange}
        />
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { borderColor: colors.error },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}>
          <Text style={[styles.deleteLabel, { color: colors.error }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
