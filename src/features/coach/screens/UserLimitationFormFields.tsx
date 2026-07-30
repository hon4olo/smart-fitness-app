import { Pressable, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useLocalization } from '@/localization';
import {
  getUserLimitationsCopy,
  type UserLimitationsCopy,
} from '@/localization/userLimitationsCopy';
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

const KIND_VALUES: readonly UserLimitationKind[] = [
  'injury',
  'pain',
  'mobility',
  'medical_restriction',
  'other',
];
const BODY_REGION_VALUES: readonly UserLimitationBodyRegion[] = [
  'neck',
  'shoulder',
  'elbow',
  'wrist_hand',
  'upper_back',
  'lower_back',
  'hip',
  'knee',
  'ankle_foot',
  'chest',
  'abdomen',
  'systemic',
  'other',
];
const SIDE_VALUES: readonly UserLimitationSide[] = [
  'left',
  'right',
  'bilateral',
  'midline',
  'not_applicable',
];
const SEVERITY_VALUES: readonly UserLimitationSeverity[] = ['mild', 'moderate', 'severe'];
const IMPACT_VALUES: readonly UserLimitationTrainingImpact[] = [
  'monitor',
  'reduce_load',
  'avoid_movement',
  'pause_training',
];
const MOVEMENT_VALUES: readonly UserLimitationMovementPattern[] = [
  'squat',
  'hinge',
  'lunge',
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'carry',
  'rotation',
  'locomotion',
  'impact',
  'overhead',
  'spinal_flexion',
  'spinal_extension',
  'other',
];

const toOptions = <Value extends string>(
  values: readonly Value[],
  labels: Record<Value, string>,
): readonly Option<Value>[] => values.map((value) => ({ label: labels[value], value }));

export const getLimitationOptions = (copy: UserLimitationsCopy) => ({
  kinds: toOptions(KIND_VALUES, copy.kindLabels),
  bodyRegions: toOptions(BODY_REGION_VALUES, copy.bodyRegionLabels),
  sides: toOptions(SIDE_VALUES, copy.sideLabels),
  severities: toOptions(SEVERITY_VALUES, copy.severityLabels),
  impacts: toOptions(IMPACT_VALUES, copy.impactLabels),
});

export function ChoiceGrid<Value extends string>({
  columns = 2,
  label,
  onChange,
  options,
  value,
}: {
  columns?: number;
  label: string;
  onChange(value: Value): void;
  options: readonly Option<Value>[];
  value: Value | null;
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
              accessibilityLabel={option.label}
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
  onToggle,
  values,
}: {
  onToggle(value: UserLimitationMovementPattern): void;
  values: UserLimitationMovementPattern[];
}) {
  const { colors } = useAppTheme();
  const { locale } = useLocalization();
  const copy = getUserLimitationsCopy(locale);
  const selected = new Set(values);
  const options = toOptions(MOVEMENT_VALUES, copy.movementLabels);

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
        {copy.movementPatterns}
      </Text>
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        {copy.movementHelper}
      </Text>
      <View accessibilityLabel={copy.movementPatterns} style={styles.choiceGrid}>
        {options.map((option) => {
          const active = selected.has(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityLabel={option.label}
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
  disabled,
  limitation,
  onDelete,
  onStatusChange,
}: {
  disabled: boolean;
  limitation: UserLimitation;
  onDelete(): void;
  onStatusChange(): void;
}) {
  const { colors } = useAppTheme();
  const { formatDate, locale } = useLocalization();
  const copy = getUserLimitationsCopy(locale);
  const formatDateOnly = (value: string) =>
    formatDate(`${value}T12:00:00`, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={[styles.limitationRow, { borderColor: colors.borderSubtle }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            {copy.bodyRegionLabels[limitation.bodyRegion]} · {copy.sideLabels[limitation.side]}
          </Text>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            {copy.kindLabels[limitation.kind]} · {copy.severityLabels[limitation.severity]} ·{' '}
            {copy.impactLabels[limitation.trainingImpact]}
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
          {copy.statusLabels[limitation.status]}
        </Text>
      </View>
      {limitation.movementPatterns.length > 0 ? (
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          {copy.movements}: {limitation.movementPatterns.map((value) => copy.movementLabels[value]).join(', ')}
        </Text>
      ) : null}
      <Text style={[styles.helperText, { color: colors.textMuted }]}>
        {copy.onset}: {limitation.onsetDate ? formatDateOnly(limitation.onsetDate) : copy.notSpecified}
        {limitation.resolvedDate
          ? ` · ${copy.resolved} ${formatDateOnly(limitation.resolvedDate)}`
          : ''}
      </Text>
      <View style={styles.rowActions}>
        <SecondaryButton
          disabled={disabled}
          label={limitation.status === 'active' ? copy.markResolved : copy.reactivate}
          onPress={onStatusChange}
        />
        <Pressable
          accessibilityLabel={copy.delete}
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { borderColor: colors.error },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}>
          <Text style={[styles.deleteLabel, { color: colors.error }]}>{copy.delete}</Text>
        </Pressable>
      </View>
    </View>
  );
}
