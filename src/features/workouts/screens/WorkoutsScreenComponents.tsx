import { router } from 'expo-router';
import { Dumbbell, Heart, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import type {
  WorkoutProgramSummary,
  WorkoutTemplateSummary,
} from '@/features/workouts/types';
import {
  getWorkoutsHubProgramTitle,
  getWorkoutsHubWorkoutTitle,
} from '@/features/workouts/workoutsHubLocalization';
import { formatPlural, useLocalization } from '@/localization';
import { useAppTheme } from '@/theme/AppThemeProvider';

import {
  createModalStyles,
  createProgramRowStyles,
  createRoutineCardStyles,
  createTopTabsStyles,
} from './workoutsScreen.styles';

const tabs = [
  { key: 'start-now', messageKey: 'workouts.tabs.startNow' },
  { key: 'programs', messageKey: 'workouts.tabs.programs' },
] as const;

export type TabKey = (typeof tabs)[number]['key'];

const cardTints = ['#EB737D', '#6BBFC2', '#8C83D8', '#E4A65A'];

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join('')
    .toUpperCase() || '+';

export function TopTabs({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createTopTabsStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{t(tab.messageKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RoutineCard({
  index,
  summary,
}: {
  index: number;
  summary: WorkoutTemplateSummary;
}) {
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const styles = useMemo(() => createRoutineCardStyles(colors), [colors]);
  const exerciseCountLabel = formatPlural(locale, summary.exerciseCount, {
    one: t('workouts.exerciseCount.one'),
    few: t('workouts.exerciseCount.few'),
    many: t('workouts.exerciseCount.many'),
    other: t('workouts.exerciseCount.other'),
  });

  const displayTitle = getWorkoutsHubWorkoutTitle(t, summary.workout);
  const displaySubtitle =
    summary.workout.isCustom && summary.subtitle ? summary.subtitle : exerciseCountLabel;

  return (
    <Pressable
      accessibilityHint={t('workouts.openTemplateHint')}
      accessibilityLabel={displayTitle}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/workouts/template/[workoutId]',
          params: { workoutId: summary.workout.id },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.cover, { backgroundColor: cardTints[index % cardTints.length] }]}>
        <Text style={styles.coverLabel}>{getInitials(displayTitle)}</Text>
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {displayTitle}
      </Text>
      <Text numberOfLines={1} style={styles.subtitle}>
        {displaySubtitle}
      </Text>
    </Pressable>
  );
}

export function ProgramRow({
  favoriteMode,
  icon,
  onPress,
  summary,
  title,
  workoutCount,
}: {
  favoriteMode?: 'show-all' | 'show-favorites';
  icon: 'add' | 'favorite' | 'program';
  onPress: () => void;
  summary?: WorkoutProgramSummary;
  title: string;
  workoutCount: number;
}) {
  const { colors } = useAppTheme();
  const { locale, t } = useLocalization();
  const styles = useMemo(() => createProgramRowStyles(colors), [colors]);
  const isAdd = icon === 'add';
  const Icon = icon === 'add' ? Plus : icon === 'favorite' ? Heart : Dumbbell;
  const workoutCountLabel = formatPlural(locale, workoutCount, {
    one: t('workouts.workoutCount.one'),
    few: t('workouts.workoutCount.few'),
    many: t('workouts.workoutCount.many'),
    other: t('workouts.workoutCount.other'),
  });

  const displayTitle = summary ? getWorkoutsHubProgramTitle(t, summary.program) : title;
  const accessibilityHint =
    icon === 'add'
      ? t('workouts.addProgramHint')
      : icon === 'favorite'
        ? t(
            favoriteMode === 'show-all'
              ? 'workouts.showAllProgramsHint'
              : 'workouts.showFavoritesHint',
          )
        : t('workouts.openProgramHint');

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={displayTitle}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconBox, isAdd && styles.addIconBox]}>
        <Icon
          color={isAdd ? colors.textPrimary : colors.textMuted}
          size={isAdd ? 30 : 22}
          strokeWidth={isAdd ? 1.8 : 2}
        />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {displayTitle}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {workoutCountLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export function CreateProgramModal({
  onClose,
  onCreate,
  visible,
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
  visible: boolean;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createModalStyles(colors), [colors]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
    }
  }, [visible]);

  const canCreate = name.trim().length > 0;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>{t('workouts.createProgramTitle')}</Text>
          <TextInput
            autoCapitalize="words"
            autoFocus
            onChangeText={setName}
            accessibilityLabel={t('workouts.programName')}
            placeholder={t('workouts.programName')}
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            selectionColor={colors.accent}
            style={styles.input}
            value={name}
            onSubmitEditing={() => {
              if (canCreate) {
                onCreate(name);
              }
            }}
          />
          {!canCreate ? (
            <Text accessibilityLiveRegion="polite" style={styles.modalHelperText}>
              {t('workouts.programNameRequired')}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityState={{ disabled: !canCreate }}
              disabled={!canCreate}
              onPress={() => onCreate(name)}
              style={({ pressed }) => [
                styles.createButton,
                !canCreate && styles.disabledButton,
                pressed && canCreate && styles.pressed,
              ]}>
              <Text style={styles.createLabel}>{t('workouts.create')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}